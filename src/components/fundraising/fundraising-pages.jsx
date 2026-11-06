"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Heart } from "lucide-react";
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
import { fundraisingService } from "@/services/fundraising.service";
import { paymentService } from "@/services/payment.service";

export function CampaignCard({ item }) {
  const pct = Math.min(
    100,
    Number(item.target_amount) > 0
      ? (Number(item.current_amount || 0) * 100) / Number(item.target_amount)
      : 0,
  );
  return (
    <Card className="overflow-hidden">
      {item.image_url ? (
        <Image
          src={item.image_url}
          alt={item.title}
          width={640}
          height={420}
          unoptimized
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="grid h-48 place-items-center bg-blue-50 text-blue-500">
          <Heart size={48} />
        </div>
      )}
      <CardContent>
        <h2 className="font-semibold">{item.title}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {item.description}
        </p>
        <div className="mt-4 h-2 rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          ${Number(item.current_amount || 0).toLocaleString()} raised of $
          {Number(item.target_amount || 0).toLocaleString()}
        </p>
        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/campaigns/${item.id}`}>View campaign</Link>
          </Button>
          <Button
            disabled
            title="Payment unavailable until the API can create a payment"
          >
            Donate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CampaignDetail({ id }) {
  const [campaign, setCampaign] = useState(null),
    [progress, setProgress] = useState(null),
    [error, setError] = useState(""),
    [msg, setMsg] = useState(""),
    [amount, setAmount] = useState(""),
    [donations, setDonations] = useState(null);
  useEffect(() => {
    Promise.all([fundraisingService.get(id), fundraisingService.progress(id)])
      .then(([a, b]) => {
        setCampaign(a.data);
        setProgress(b.data);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  if (error) return <Notice>{error}</Notice>;
  if (!campaign) return <Spinner />;
  const donate = async (method) => {
    try {
      const r = await paymentService.create({
        payment_type: "donation",
        payment_method: method,
        amount: Number(amount),
        currency: "USD",
        campaign_id: id,
      });
      setMsg(`Donation payment request created: ${r.data.id}`);
    } catch (e) {
      setMsg(e.message);
    }
  };
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        eyebrow="Fundraising"
        title={campaign.title}
        description={campaign.description}
      />
      <Card>
        <CardContent>
          <div className="mb-2 flex justify-between text-sm">
            <span>
              Raised ${Number(progress?.current_amount || 0).toLocaleString()}
            </span>
            <span>
              Goal ${Number(progress?.target_amount || 0).toLocaleString()}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${progress?.progress_percent || 0}%` }}
            />
          </div>
          <p className="mt-5 text-sm text-slate-500">
            Campaign donations are visible through the public donations
            endpoint. The API currently rejects Bakong payment creation and does
            not produce KHQR.
          </p>
          <div className="mt-4 max-w-xs">
            <Label htmlFor="donation-amount">Donation amount (USD)</Label>
            <Input
              id="donation-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter an amount"
            />
          </div>
          <div className="mt-5 flex gap-2">
            <Button
              disabled={!amount || Number(amount) <= 0}
              onClick={() => donate("cash")}
            >
              Request cash donation
            </Button>
            <Button
              variant="outline"
              disabled
              title="The API has no KHQR creation available"
            >
              Bakong unavailable
            </Button>
          </div>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={async () => {
              try {
                const result = await fundraisingService.donations(id);
                setDonations(asArray(result.data));
              } catch (e) {
                setMsg(e.message);
              }
            }}
          >
            View verified donations
          </Button>
          {donations && (
            <div className="mt-3 space-y-2">
              {donations.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No verified donations yet.
                </p>
              ) : (
                donations.map((donation) => (
                  <p
                    key={donation.id}
                    className="rounded-lg bg-slate-50 p-2 text-sm"
                  >
                    {donation.amount} {donation.currency} ·{" "}
                    {donation.paid_at
                      ? new Date(donation.paid_at).toLocaleDateString()
                      : "Paid"}
                  </p>
                ))
              )}
            </div>
          )}
          {msg && (
            <div className="mt-4">
              <Notice>{msg}</Notice>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CampaignCreate() {
  const [error, setError] = useState(""),
    [note, setNote] = useState("");
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        animal_name: z.string().optional(),
        image_url: z.string().url().optional().or(z.literal("")),
        target_amount: z.coerce.number().positive(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
      }),
    ),
  });
  const submit = handleSubmit(async (values) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== ""),
      );
      const r = await fundraisingService.create(payload);
      setNote(`Campaign draft created (ID ${r.data.id}, pending review).`);
    } catch (e) {
      setError(e.message);
    }
  });
  return (
    <>
      <PageTitle
        title="Start a campaign"
        description="Create a campaign draft. The API starts it as pending; an admin must review it before it is public."
      />
      {error && <Notice>{error}</Notice>}
      {note && <Notice kind="success">{note}</Notice>}
      <form
        onSubmit={submit}
        className="max-w-2xl space-y-4 rounded-2xl border bg-white p-6"
      >
        {[
          ["title", "Campaign title"],
          ["animal_name", "Animal name"],
          ["target_amount", "Target amount"],
        ].map(([k, l]) => (
          <Field key={k} label={l}>
            <Input
              {...register(k)}
              type={k === "target_amount" ? "number" : "text"}
              min={k === "target_amount" ? "0.01" : undefined}
            />
          </Field>
        ))}
        <Field label="Image URL">
          <Input {...register("image_url")} />
        </Field>
        <Field label="Description">
          <Textarea {...register("description")} />
        </Field>
        <Field label="Start date">
          <Input type="date" {...register("start_date")} />
        </Field>
        <Field label="End date">
          <Input type="date" {...register("end_date")} />
        </Field>
        <Button>Create campaign</Button>
      </form>
    </>
  );
}
