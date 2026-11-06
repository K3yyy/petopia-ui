"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { titleCase } from "@/lib/format";
import { lostFoundService } from "@/services/lost-found.service";

export function ReportCard({ item }) {
  return (
    <Card className="overflow-hidden">
      {item.image_url ? (
        <Image
          src={item.image_url}
          alt="Reported pet"
          width={640}
          height={420}
          unoptimized
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="grid h-48 place-items-center bg-amber-50 text-amber-500">
          <PawPrint size={48} />
        </div>
      )}
      <CardContent>
        <div className="mb-2 flex justify-between">
          <strong className="capitalize">
            {item.report_type} {item.animal_type}
          </strong>
          <span className="text-xs text-slate-500">{item.status}</span>
        </div>
        <p className="line-clamp-2 text-sm text-slate-600">
          {item.description ||
            "Please contact the reporter if you have information."}
        </p>
        <p className="mt-3 flex items-center gap-1 text-sm text-slate-500">
          <MapPin size={14} />
          {item.last_seen_location || "Location not listed"}
        </p>
        <Button asChild variant="outline" className="mt-4 w-full">
          <Link href={`/lost-found/${item.id}`}>View report</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function CreateReport() {
  const [err, setErr] = useState(""),
    [msg, setMsg] = useState(""),
    [reportId, setReportId] = useState(null);
  const schema = z.object({
    report_type: z.enum(["lost", "found"]),
    animal_type: z.string().min(1),
    breed: z.string().optional(),
    description: z.string().optional(),
    last_seen_location: z.string().optional(),
    reward_amount: z.coerce.number().nonnegative().optional(),
  });
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { report_type: "lost" },
  });
  const submit = handleSubmit(async (v) => {
    try {
      const r = await lostFoundService.create(v);
      setReportId(r.data.id);
      setMsg("Report created. You can now add one photo.");
    } catch (e) {
      setErr(e.message);
    }
  });
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !/^image\/(jpeg|png|webp)$/.test(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setErr("Choose a JPEG, PNG, or WebP image up to 10 MB.");
      return;
    }
    try {
      await lostFoundService.image(reportId, file);
      setMsg("Photo uploaded successfully.");
    } catch (ex) {
      setErr(ex.message);
    }
  };
  return (
    <>
      <PageTitle
        title="Create a lost or found report"
        description="Create the report first. The API then accepts one image upload for that report."
      />
      {err && <Notice>{err}</Notice>}
      {msg && <Notice kind="success">{msg}</Notice>}
      <form
        onSubmit={submit}
        className="max-w-2xl space-y-4 rounded-2xl border bg-white p-6"
      >
        <Field label="Report type">
          <select
            {...register("report_type")}
            className="w-full rounded-xl border p-2.5"
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </Field>
        {[
          ["animal_type", "Animal type"],
          ["breed", "Breed"],
          ["last_seen_location", "Last seen location"],
        ].map(([k, l]) => (
          <Field key={k} label={l}>
            <Input {...register(k)} />
          </Field>
        ))}
        <Field label="Description">
          <Textarea {...register("description")} />
        </Field>
        <Field label="Reward amount">
          <Input
            type="number"
            min="0"
            step="0.01"
            {...register("reward_amount")}
          />
        </Field>
        <Button>Create report</Button>
      </form>
      {reportId && (
        <div className="mt-5 max-w-2xl rounded-2xl bg-white p-5">
          <Field label="Report photo">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={upload}
            />
          </Field>
        </div>
      )}
    </>
  );
}

export function ReportDetail({ id, profile }) {
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { register, handleSubmit, reset } = useForm();
  const load = useCallback(
    () =>
      lostFoundService
        .get(id)
        .then((r) => {
          setReport(r.data);
          reset(r.data);
        })
        .catch((e) => setError(e.message)),
    [id, reset],
  );
  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);
  const save = handleSubmit(async (values) => {
    try {
      setError("");
      const payload = {
        description: values.description,
        last_seen_location: values.last_seen_location,
        ...(values.reward_amount !== "" && values.reward_amount !== undefined
          ? { reward_amount: Number(values.reward_amount) }
          : {}),
      };
      const result = await lostFoundService.update(id, payload);
      setReport(result.data);
      setNotice("Report updated.");
    } catch (e) {
      setError(e.message);
    }
  });
  const updateStatus = async (status) => {
    try {
      const result = await lostFoundService.status(id, status);
      setReport(result.data);
      setNotice(`Report marked ${status}.`);
    } catch (e) {
      setError(e.message);
    }
  };
  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !/^image\/(jpeg|png|webp)$/.test(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choose a JPEG, PNG, or WebP image up to 10 MB.");
      return;
    }
    try {
      const result = await lostFoundService.image(id, file);
      setReport(result.data);
      setNotice("Report photo uploaded.");
    } catch (e) {
      setError(e.message);
    }
  };
  const removeReport = async () => {
    if (!window.confirm("Delete this lost and found report?")) return;
    try {
      await lostFoundService.remove(id);
      router.push("/lost-found");
    } catch (e) {
      setError(e.message);
    }
  };
  if (error && !report) return <Notice>{error}</Notice>;
  if (!report) return <Spinner />;
  const owner = profile && String(profile.id) === String(report.reporter_id);
  return (
    <>
      <PageTitle
        eyebrow={`${report.report_type} report`}
        title={`${titleCase(report.animal_type)}${report.breed ? ` · ${report.breed}` : ""}`}
        description={report.description}
      />
      <Card className="max-w-3xl overflow-hidden">
        {report.image_url && (
          <Image
            src={report.image_url}
            alt="Reported pet"
            width={900}
            height={560}
            unoptimized
            className="max-h-96 w-full object-cover"
          />
        )}
        <CardContent>
          <p className="text-sm text-slate-600">
            Location: {report.last_seen_location || "Not provided"}
          </p>
          <p className="mt-2 text-sm text-slate-600">Status: {report.status}</p>
          {Number(report.reward_amount) > 0 && (
            <p className="mt-2 text-sm font-semibold">
              Reward: ${report.reward_amount}
            </p>
          )}
        </CardContent>
      </Card>
      {owner && (
        <div className="mt-5 max-w-3xl space-y-4">
          <Card>
            <CardContent>
              <h2 className="mb-4 font-semibold">Update your report</h2>
              {error && <Notice>{error}</Notice>}
              <form onSubmit={save} className="space-y-3">
                <Field label="Description">
                  <Textarea {...register("description")} />
                </Field>
                <Field label="Last seen location">
                  <Input {...register("last_seen_location")} />
                </Field>
                <Field label="Reward amount">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("reward_amount")}
                  />
                </Field>
                <Button>Save report</Button>
              </form>
              <div className="mt-4">
                <Field label="Report photo (JPEG, PNG, or WebP; up to 10 MB)">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={uploadImage}
                  />
                </Field>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => updateStatus("reunited")}
                >
                  Mark reunited
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateStatus("closed")}
                >
                  Close report
                </Button>
                <Button variant="ghost" onClick={removeReport}>
                  Delete report
                </Button>
              </div>
            </CardContent>
          </Card>
          {notice && <Notice kind="success">{notice}</Notice>}
        </div>
      )}
      {!owner && (
        <p className="mt-4 text-sm text-slate-500">
          For information about this report, sign in to message the reporter
          using their profile ID {report.reporter_id}.
        </p>
      )}
    </>
  );
}
