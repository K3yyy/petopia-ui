
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
import { Input, Textarea } from "@/components/ui/field";

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

// --------------------------------------------------
// PET IMAGE
// --------------------------------------------------

function getPetImage(pet) {
    if (!pet) return null;

    const media = Array.isArray(pet.media) ? pet.media : [];
    const asUrl = (value) => {
        if (typeof value === "string") return value.trim() || null;
        if (value && typeof value === "object") {
            return asUrl(value.media_url || value.url || value.public_url);
        }
        return null;
    };

    return asUrl(pet.image_url) || asUrl(pet.primary_image) ||
        asUrl(media.find((item) => item?.is_primary)?.media_url) ||
        asUrl(media.find((item) => item?.media_url)?.media_url) || null;
}

function PetImage({
                      pet,
                      className = "",
                      fill = false,
                      iconSize = 54,
                  }) {
    const listedImage = getPetImage(pet);
    const [mediaImage, setMediaImage] = useState(null);
    const [imageError, setImageError] = useState(false);
    const image = listedImage || mediaImage;

    useEffect(() => {
        setImageError(false);
        setMediaImage(null);
        if (listedImage || !pet?.id) return;

        let active = true;
        petMediaService.list(pet.id)
            .then((response) => {
                const media = asArray(response.data);
                const primary = media.find((item) => item?.is_primary && getPetImage({ media: [item] }));
                const selected = primary || media.find((item) => getPetImage({ media: [item] }));
                const selectedUrl = selected ? getPetImage({ media: [selected] }) : null;

                if (["32", "35", "26"].includes(String(pet.id))) {
                    console.info("[PetLink pet media]", {
                        petId: pet.id,
                        response: media,
                        selectedImageUrl: selectedUrl,
                    });
                }
                if (active) setMediaImage(selectedUrl);
            })
            .catch((error) => {
                if (["32", "35", "26"].includes(String(pet.id))) {
                    console.error("[PetLink pet media]", { petId: pet.id, error: error.message });
                }
            });

        return () => { active = false; };
    }, [pet?.id, listedImage]);

    useEffect(() => {
        setImageError(false);
    }, [image]);

    if (!image || imageError) {
        return (
            <div
                className={`grid place-items-center bg-gradient-to-br from-sky-100 to-blue-50 text-blue-400 ${className}`}
            >
                <PawPrint size={iconSize} />
            </div>
        );
    }

    return (
        <Image
            key={image}
            src={image}
            alt={pet?.name || "Pet"}
            width={fill ? undefined : 640}
            height={fill ? undefined : 420}
            fill={fill}
            unoptimized
            onError={() => setImageError(true)}
            onLoad={() => {
                if (["32", "35", "26"].includes(String(pet?.id))) {
                    console.info("[PetLink image loaded]", { petId: pet.id, imageUrl: image });
                }
            }}
            className={className}
        />
    );
}

// --------------------------------------------------
// PET CARD
// --------------------------------------------------

export function PetCard({ pet }) {
    return (
        <Card className="group overflow-hidden">
            <Link href={`/pets/${pet.id}`} className="block">
                <PetImage
                    pet={pet}
                    className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
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
                            {[pet.breed, pet.age, pet.gender]
                                .filter(Boolean)
                                .join(" · ") || pet.animal_type}
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

// --------------------------------------------------
// PET DETAIL
// --------------------------------------------------

export function PetDetail({ id, user, profile }) {
    const [pet, setPet] = useState(null);
    const [err, setErr] = useState("");
    const [message, setMessage] = useState("");
    const [result, setResult] = useState("");

    useEffect(() => {
        petService
            .get(id)
            .then((r) => setPet(r.data))
            .catch((e) => setErr(e.message));
    }, [id]);

    const isOwner =
        profile && pet && String(profile.id) === String(pet.owner_id);

    const apply = async () => {
        if (!user || isOwner) return;

        try {
            setResult("");
            await applicationService.apply(id, message);
            setResult("Application submitted.");
        } catch (e) {
            setResult(e.message);
        }
    };

    const buy = async () => {
        if (!user || isOwner) return;

        try {
            setResult("");

            await paymentService.create({
                payment_type: "pet_purchase",
                payment_method: "cash",
                amount: Number(pet.price),
                currency: "USD",
                pet_id: id,
            });

            setResult(
                "Cash payment request created. Coordinate with the seller to complete payment."
            );
        } catch (e) {
            setResult(e.message);
        }
    };

    if (err) return <Notice>{err}</Notice>;
    if (!pet) return <Spinner />;

    const available = pet.status === "available";

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            {/* Pet image */}
            <div className="relative min-h-80 overflow-hidden rounded-3xl bg-blue-50">
                <PetImage
                    pet={pet}
                    fill
                    iconSize={88}
                    className="object-cover"
                />
            </div>

            {/* Pet information */}
            <div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
          {pet.listing_type}
        </span>

                <h1 className="mt-4 text-4xl font-bold">
                    {pet.name}
                </h1>

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
                        ${Number(pet.price || 0).toFixed(2)}
                    </p>
                )}

                <p className="my-6 whitespace-pre-wrap text-slate-700">
                    {pet.description || "No description provided."}
                </p>

                {/* Actions */}
                {!available ? (
                    <Notice>
                        Applications and purchases are unavailable for this{" "}
                        {pet.status} listing.
                    </Notice>
                ) : !user ? (
                    <Button asChild>
                        <Link href="/login">
                            Sign in to contact the owner
                        </Link>
                    </Button>
                ) : isOwner ? (
                    <Notice kind="success">
                        This is your pet listing.
                    </Notice>
                ) : pet.listing_type === "sale" ? (
                    <Button onClick={buy}>
                        Request cash payment
                    </Button>
                ) : (
                    <div className="space-y-3">
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Introduce yourself to the pet's owner"
                        />

                        <Button onClick={apply}>
                            Apply to adopt
                        </Button>
                    </div>
                )}

                {result && (
                    <div className="mt-4">
                        <Notice
                            kind={
                                result.includes("submitted") ||
                                result.includes("created")
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

// --------------------------------------------------
// CREATE PET
// --------------------------------------------------

export function CreatePet() {
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");
    const [createdId, setCreatedId] = useState(null);

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
                })
        ),
        defaultValues: {
            price: 0,
            listing_type: "adoption",
        },
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
                    <Field
                        key={key}
                        label={label}
                        error={errors[key]?.message}
                    >
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
                    <Textarea
                        {...register("description")}
                        className="min-h-24"
                    />
                </Field>

                <div className="sm:col-span-2">
                    <Button type="submit">
                        Create listing
                    </Button>
                </div>
            </form>
        </>
    );
}

// --------------------------------------------------
// EDIT PET
// --------------------------------------------------

export function EditPet({ id }) {
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const {
        register,
        handleSubmit,
        reset,
    } = useForm();

    useEffect(() => {
        petService
            .get(id)
            .then((r) => reset(r.data))
            .catch((e) => setError(e.message));
    }, [id, reset]);

    const submit = handleSubmit(async (values) => {
        try {
            setError("");
            setNotice("");

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
                        key === "price"
                            ? Number(values[key] || 0)
                            : values[key],
                    ])
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
                    <Button type="submit">
                        Save changes
                    </Button>
                </div>
            </form>
        </>
    );
}

// --------------------------------------------------
// PET LISTING ACTIONS
// --------------------------------------------------

export function PetListingActions({ pet }) {
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    return (
        <div className="flex flex-wrap gap-2">
            {error && (
                <span className="text-xs text-rose-600">
          {error}
        </span>
            )}

            <Button asChild variant="outline">
                <Link href={`/dashboard/my-pets/${pet.id}/edit`}>
                    Edit
                </Link>
            </Button>

            {["available", "hidden"].includes(pet.status) && (
                <Button
                    variant="outline"
                    disabled={busy}
                    onClick={async () => {
                        setBusy(true);
                        setError("");

                        try {
                            await petService.update(pet.id, {
                                status:
                                    pet.status === "hidden"
                                        ? "available"
                                        : "hidden",
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
                        setError("");
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

// --------------------------------------------------
// APPLICATION DETAIL
// --------------------------------------------------

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
        [id]
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

            {message && (
                <Notice kind="success">{message}</Notice>
            )}

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

// --------------------------------------------------
// PET MEDIA MANAGEMENT
// --------------------------------------------------

export function PetMedia({
                             id,
                             profile,
                             isAdmin = false,
                             canManage = false,
                         }) {
    const [media, setMedia] = useState([]);
    const [error, setError] = useState("");
    const [pet, setPet] = useState(null);
    const [uploading, setUploading] = useState(false);

    const load = useCallback(() => {
        return petMediaService
            .list(id)
            .then((r) => setMedia(asArray(r.data)))
            .catch((e) => setError(e.message));
    }, [id]);

    useEffect(() => {
        load();
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
        (profile &&
            pet &&
            String(profile.id) === String(pet.owner_id));

    const upload = async (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

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
            e.target.value = "";
            return;
        }

        try {
            setError("");
            setUploading(true);

            await petMediaService.upload(id, file);
            await load();

            e.target.value = "";
        } catch (x) {
            setError(x.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold">
                Photos and videos
            </h2>

            {error && <Notice>{error}</Notice>}

            {mayManage && (
                <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                    disabled={uploading}
                    onChange={upload}
                />
            )}

            {uploading && (
                <p className="mt-2 text-sm text-slate-500">
                    Uploading media...
                </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {media.map((m) => (
                    <Card key={m.id}>
                        <CardContent>
                            {m.media_type === "video" ? (
                                <video
                                    src={m.media_url}
                                    controls
                                    className="w-full rounded-xl"
                                />
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
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={async () => {
                                            try {
                                                setError("");
                                                await petMediaService.primary(m.id);
                                                await load();
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
                                                setError("");
                                                await petMediaService.remove(m.id);
                                                await load();
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

            {media.length === 0 && !error && (
                <p className="mt-4 text-sm text-slate-500">
                    No photos or videos uploaded yet.
                </p>
            )}
        </section>
    );
}
