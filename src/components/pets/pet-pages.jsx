"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PawPrint, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";
import {
  Notice,
  PageTitle,
  Spinner,
  Field,
} from "@/components/common/feedback";
import { asArray } from "@/lib/format";
import { petService } from "@/services/pet.service";
import { petMediaService } from "@/services/pet-media.service";
import { applicationService } from "@/services/application.service";
import { paymentService } from "@/services/payment.service";

export function PetCard({ pet }) {
  const image =
    pet.image_url ||
    pet.primary_image ||
    pet.media?.find?.((m) => m.is_primary)?.media_url;
  return (
    <Card className="group overflow-hidden">
      <Link href={`/pets/${pet.id}`} className="block">
        {image ? (
          <Image
            src={image}
            alt={pet.name || "Pet"}
            width={640}
            height={420}
            unoptimized
            className="h-52 w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-52 place-items-center bg-gradient-to-br from-sky-100 to-blue-50 text-blue-400">
            <PawPrint size={54} />
          </div>
        )}
      </Link>
      <CardContent>
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/pets/${pet.id}`}
              className="font-semibold text-slate-900 hover:text-blue-700"
            >
              {pet.name || `${pet.animal_type} looking for a home`}
            </Link>
            <p className="mt-1 text-sm text-slate-500">
              {[pet.breed, pet.age, pet.gender].filter(Boolean).join(" · ") ||
                pet.animal_type}
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
            {pet.listing_type}
          </span>
        </div>
        <p className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin size={14} />
          {pet.location || "Location not listed"}
        </p>
        {pet.listing_type === "sale" && (
          <p className="mt-3 font-semibold text-slate-900">
            ${Number(pet.price || 0).toFixed(2)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function PetDetail({ id, user, profile }) {
  const [pet, setPet] = useState(null),
    [err, setErr] = useState(""),
    [message, setMessage] = useState(""),
    [result, setResult] = useState("");
  useEffect(() => {
    petService
      .get(id)
      .then((r) => setPet(r.data))
      .catch((e) => setErr(e.message));
  }, [id]);
  if (err) return <Notice>{err}</Notice>;
  if (!pet) return <Spinner />;
  const isOwner = profile && String(profile.id) === String(pet.owner_id);
  const apply = async () => {
    if (!user || isOwner) return;
    try {
      await applicationService.apply(id, message);
      setResult("Application submitted.");
    } catch (e) {
      setResult(e.message);
    }
  };
  const buy = async () => {
    if (!user || isOwner) return;
    try {
      await paymentService.create({
        payment_type: "pet_purchase",
        payment_method: "cash",
        amount: Number(pet.price),
        currency: "USD",
        pet_id: id,
      });
      setResult(
        "Cash payment request created. Coordinate with the seller to complete payment.",
      );
    } catch (e) {
      setResult(e.message);
    }
  };
  const available = pet.status === "available";
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="grid min-h-80 place-items-center rounded-3xl bg-blue-50 text-blue-300">
        <PawPrint size={88} />
      </div>
      <div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
          {pet.listing_type}
        </span>
        <h1 className="mt-4 text-4xl font-bold">{pet.name}</h1>
        <p className="mt-2 text-slate-500">
          {[pet.animal_type, pet.breed, pet.age, pet.gender]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-4 flex items-center gap-2 text-slate-500">
          <MapPin size={17} />
          {pet.location || "Location not listed"}
        </p>
        {pet.listing_type === "sale" && (
          <p className="mt-6 text-2xl font-bold">
            ${Number(pet.price).toFixed(2)}
          </p>
        )}
        <p className="my-6 whitespace-pre-wrap text-slate-700">
          {pet.description || "No description provided."}
        </p>
        {!available ? (
          <Notice>
            Applications and purchases are unavailable for this {pet.status}{" "}
            listing.
          </Notice>
        ) : !user ? (
          <Button asChild>
            <Link href="/login">Sign in to contact the owner</Link>
          </Button>
        ) : isOwner ? (
          <Notice kind="success">This is your pet listing.</Notice>
        ) : pet.listing_type === "sale" ? (
          <Button onClick={buy}>Request cash payment</Button>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself to the pet's owner"
            />
            <Button onClick={apply}>Apply to adopt</Button>
          </div>
        )}
        {result && (
          <div className="mt-4">
            <Notice
              kind={
                result.includes("submitted") || result.includes("created")
                  ? "success"
                  : "error"
              }
            >
              {result}
            </Notice>
          </div>
        )}
        <p className="mt-4 text-xs text-slate-400">
          Cash requests are only confirmed by the seller through the API.
        </p>
      </div>
    </div>
  );
}

export function CreatePet() {
  const [err, setErr] = useState(""),
    [success, setSuccess] = useState(""),
    [createdId, setCreatedId] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      z
        .object({
          name: z.string().min(1),
          animal_type: z.string().min(1),
          listing_type: z.enum(["adoption", "sale", "rehoming"]),
          price: z.coerce.number().nonnegative(),
          breed: z.string().optional(),
          gender: z.string().optional(),
          age: z.string().optional(),
          description: z.string().optional(),
          location: z.string().optional(),
        })
        .superRefine((value, context) => {
          if (value.listing_type === "sale" && value.price <= 0) {
            context.addIssue({
              code: "custom",
              path: ["price"],
              message: "Sale listings require a price above zero.",
            });
          }
          if (value.listing_type !== "sale" && value.price !== 0) {
            context.addIssue({
              code: "custom",
              path: ["price"],
              message: "Adoption and rehoming listings must be free.",
            });
          }
        }),
    ),
    defaultValues: { price: 0 },
  });
  const submit = handleSubmit(async (v) => {
    setErr("");
    setSuccess("");
    try {
      const r = await petService.create(v);
      setCreatedId(r.data.id);
      setSuccess(`Pet listing created (ID ${r.data.id}).`);
    } catch (e) {
      setErr(e.message);
    }
  });
  return (
    <>
      <PageTitle
        title="Create a pet listing"
        description="Share the pet's details. Adoption and rehoming listings must be free; sale listings require a price."
      />
      {err && <Notice>{err}</Notice>}
      {success && <Notice kind="success">{success}</Notice>}
      {createdId && (
        <Button asChild variant="outline" className="mt-3">
          <Link href={`/dashboard/my-pets/${createdId}/media`}>
            Manage pet photos and videos
          </Link>
        </Button>
      )}
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-2"
      >
        {[
          ["name", "Pet name"],
          ["animal_type", "Animal type"],
          ["breed", "Breed"],
          ["gender", "Gender"],
          ["age", "Age"],
          ["location", "Location"],
          ["price", "Price (USD)"],
        ].map(([key, label]) => (
          <Field key={key} label={label} error={errors[key]?.message}>
            <Input
              {...register(key)}
              type={key === "price" ? "number" : "text"}
              step={key === "price" ? "0.01" : undefined}
            />
          </Field>
        ))}
        <Field label="Listing type">
          <select
            {...register("listing_type")}
            className="w-full rounded-xl border border-slate-200 p-2.5"
          >
            <option value="adoption">Adoption</option>
            <option value="sale">Sale</option>
            <option value="rehoming">Free rehoming</option>
          </select>
        </Field>
        <Field label="Description">
          <Textarea {...register("description")} className="min-h-24" />
        </Field>
        <div className="sm:col-span-2">
          <Button>Create listing</Button>
        </div>
      </form>
    </>
  );
}

export function EditPet({ id }) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { register, handleSubmit, reset } = useForm();
  useEffect(() => {
    petService
      .get(id)
      .then((r) => reset(r.data))
      .catch((e) => setError(e.message));
  }, [id, reset]);
  const submit = handleSubmit(async (values) => {
    try {
      setError("");
      const allowed = [
        "name",
        "animal_type",
        "breed",
        "gender",
        "age",
        "description",
        "listing_type",
        "price",
        "location",
        "status",
      ];
      const payload = Object.fromEntries(
        allowed
          .filter((key) => values[key] !== undefined)
          .map((key) => [
            key,
            key === "price" ? Number(values[key] || 0) : values[key],
          ]),
      );
      await petService.update(id, payload);
      setNotice("Pet listing saved.");
    } catch (e) {
      setError(e.message);
    }
  });
  return (
    <>
      <PageTitle
        title="Edit pet listing"
        description="Update the fields accepted by the pet API."
      />
      {error && <Notice>{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}
      <form
        onSubmit={submit}
        className="grid max-w-3xl gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-2"
      >
        {[
          ["name", "Pet name"],
          ["animal_type", "Animal type"],
          ["breed", "Breed"],
          ["gender", "Gender"],
          ["age", "Age"],
          ["location", "Location"],
          ["price", "Price (USD)"],
        ].map(([key, label]) => (
          <Field key={key} label={label}>
            <Input
              {...register(key)}
              type={key === "price" ? "number" : "text"}
              step={key === "price" ? "0.01" : undefined}
            />
          </Field>
        ))}
        <Field label="Listing type">
          <select
            {...register("listing_type")}
            className="w-full rounded-xl border p-2.5"
          >
            <option value="adoption">Adoption</option>
            <option value="sale">Sale</option>
            <option value="rehoming">Free rehoming</option>
          </select>
        </Field>
        <Field label="Status">
          <select
            {...register("status")}
            className="w-full rounded-xl border p-2.5"
          >
            <option value="available">Available</option>
            <option value="hidden">Hidden</option>
          </select>
        </Field>
        <Field label="Description">
          <Textarea {...register("description")} />
        </Field>
        <div>
          <Button>Save changes</Button>
        </div>
      </form>
    </>
  );
}

export function PetListingActions({ pet }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      {error && <span className="text-xs text-rose-600">{error}</span>}
      <Button asChild variant="outline">
        <Link href={`/dashboard/my-pets/${pet.id}/edit`}>Edit</Link>
      </Button>
      {["available", "hidden"].includes(pet.status) && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await petService.update(pet.id, {
                status: pet.status === "hidden" ? "available" : "hidden",
              });
              window.location.reload();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {pet.status === "hidden" ? "Show" : "Hide"}
        </Button>
      )}
      <Button
        variant="ghost"
        onClick={async () => {
          if (!window.confirm("Delete this pet listing?")) return;
          try {
            await petService.remove(pet.id);
            window.location.reload();
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        Delete
      </Button>
    </div>
  );
}

export function ApplicationDetail({ id }) {
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(
    () =>
      applicationService
        .get(id)
        .then((r) => setApplication(r.data))
        .catch((e) => setError(e.message)),
    [id],
  );
  useEffect(() => {
    load();
  }, [load]);
  const update = async (status) => {
    try {
      setError("");
      const r = await applicationService.status(id, status);
      setApplication(r.data);
      setMessage(`Application ${status}.`);
    } catch (e) {
      setError(e.message);
    }
  };
  if (error) return <Notice>{error}</Notice>;
  if (!application) return <Spinner />;
  return (
    <>
      <PageTitle
        title={`Application #${application.id}`}
        description={`For pet listing ${application.pet_id}.`}
      />
      {message && <Notice kind="success">{message}</Notice>}
      <Card>
        <CardContent>
          <p>
            <strong>Status:</strong> {application.status}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-slate-600">
            {application.message || "No message was included."}
          </p>
          {application.status === "pending" && (
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => update("cancelled")}
            >
              Cancel application
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export function PetMedia({ id, profile, isAdmin = false, canManage = false }) {
  const [media, setMedia] = useState([]),
    [error, setError] = useState(""),
    [pet, setPet] = useState(null);
  const load = useCallback(
    () =>
      petMediaService
        .list(id)
        .then((r) => setMedia(asArray(r.data)))
        .catch((e) => setError(e.message)),
    [id],
  );
  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);
  useEffect(() => {
    petService
      .get(id)
      .then((r) => setPet(r.data))
      .catch((e) => setError(e.message));
  }, [id]);
  const mayManage =
    canManage ||
    isAdmin ||
    (profile && pet && String(profile.id) === String(pet.owner_id));
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-bold">Photos and videos</h2>
      {error && <Notice>{error}</Notice>}
      {mayManage && (
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          onChange={async (e) => {
            if (!e.target.files[0]) return;
            const file = e.target.files[0];
            const validTypes = [
              "image/jpeg",
              "image/png",
              "image/webp",
              "video/mp4",
              "video/webm",
              "video/quicktime",
            ];
            if (
              !validTypes.includes(file.type) ||
              file.size > 20 * 1024 * 1024
            ) {
              setError("Choose a supported image or video up to 20 MB.");
              return;
            }
            try {
              await petMediaService.upload(id, file);
              load();
            } catch (x) {
              setError(x.message);
            }
          }}
        />
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {media.map((m) => (
          <Card key={m.id}>
            <CardContent>
              {m.media_type === "video" ? (
                <video src={m.media_url} controls className="w-full" />
              ) : (
                <Image
                  src={m.media_url}
                  alt="Pet media"
                  width={640}
                  height={420}
                  unoptimized
                  className="h-40 w-full rounded-xl object-cover"
                />
              )}
              {mayManage && (
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await petMediaService.primary(m.id);
                        load();
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  >
                    Set primary
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await petMediaService.remove(m.id);
                        load();
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
