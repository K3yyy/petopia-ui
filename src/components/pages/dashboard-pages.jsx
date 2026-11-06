"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import {
  CircleDollarSign,
  Heart,
  MessageCircle,
  PawPrint,
  Plus,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";
import {
  Notice,
  PageTitle,
  Spinner,
  Empty,
  TableSkeleton,
  Field,
} from "@/components/common/feedback";
import { asArray } from "@/lib/format";
import {
  PetMedia,
  CreatePet,
  CreateReport,
  EditPet,
  PetListingActions,
  ApplicationDetail,
} from "@/components/pages/public-pages";
import { profileService } from "@/services/profile.service";
import { petService } from "@/services/pet.service";
import { petMediaService } from "@/services/pet-media.service";
import { applicationService } from "@/services/application.service";
import { messageService } from "@/services/message.service";
import { fundraisingService } from "@/services/fundraising.service";
import { paymentService } from "@/services/payment.service";

export function DataPage({ title, load, columns, description }) {
  const pageSize = 20;
  const [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true),
    [offset, setOffset] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setBusy(true);
        setError("");
        return load({ limit: pageSize, offset });
      })
      .then((r) => {
        if (active && r) setRows(asArray(r.data));
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => active && setBusy(false));
    return () => {
      active = false;
    };
  }, [load, offset]);
  return (
    <>
      <PageTitle title={title} description={description} />
      {error && <Notice>{error}</Notice>}
      {busy ? (
        <TableSkeleton columns={columns.length} />
      ) : rows.length === 0 ? (
        <Empty label="No records found." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id || i} className="border-t border-slate-100">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!busy && !error && (offset > 0 || rows.length === pageSize) && (
        <div className="mt-4 flex justify-between">
          <Button
            variant="outline"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - pageSize))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={rows.length < pageSize}
            onClick={() => setOffset(offset + pageSize)}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}

export function ProfilePage({ profile, setProfile }) {
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const { register, handleSubmit } = useForm({
    defaultValues: {
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
      profile_image: profile?.profile_image || "",
    },
  });
  const save = handleSubmit(async (v) => {
    try {
      const payload = { ...v };
      if (!payload.profile_image) delete payload.profile_image;
      const r = await profileService.update(payload);
      setProfile(r.data);
      setNotice("Profile saved.");
    } catch (e) {
      setError(e.message);
    }
  });
  return (
    <>
      <PageTitle
        title="My profile"
        description="Edit the fields supported by the profile API."
      />
      {error && <Notice>{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}
      <form
        onSubmit={save}
        className="max-w-xl space-y-4 rounded-2xl border bg-white p-6"
      >
        {[
          ["full_name", "Full name"],
          ["phone", "Phone"],
          ["address", "Address"],
          ["profile_image", "Profile image URL"],
        ].map(([k, l]) => (
          <Field key={k} label={l}>
            <Input {...register(k)} />
          </Field>
        ))}
        <Button>Save profile</Button>
      </form>
      <Card className="mt-5 max-w-xl">
        <CardContent>
          <h2 className="font-semibold">Seller verification</h2>
          <p className="my-2 text-sm text-slate-500">
            Current status: {profile?.verification_status || "unknown"}
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await profileService.verify({
                  seller_type: profile?.seller_type,
                });
                setNotice("Verification requested.");
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            Request verification
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

export function Dashboard({
  path,
  profile,
  setProfile,
  auth,
  petId,
  mediaId,
  applicationId,
}) {
  const routes = {
    dashboard: ["Your Petopia", "Manage your activity and account."],
    "my-pets": ["My pet listings", "Listings you created through the pet API."],
    applications: [
      "My applications",
      "Adoption and rehoming applications you submitted.",
    ],
    donations: [
      "My donations",
      "Donation payment history from the payments API.",
    ],
    "my-reports": ["My lost and found reports", "Manage reports you created."],
    "seller-applications": [
      "Applications received",
      "Applications for pets you own.",
    ],
    payments: ["Purchases and payments", "Payment history for your account."],
    "seller-payments": [
      "Seller payments",
      "Cash payment requests awaiting seller confirmation.",
    ],
    messages: ["Messages", "Your conversation list."],
    "edit-profile": [
      "My profile",
      "Update your profile and seller verification.",
    ],
    "create-pet": [
      "Create a pet listing",
      "Post an adoption, sale, or rehoming listing.",
    ],
    "new-report": [
      "Create a lost or found report",
      "Share a report with your community.",
    ],
  };
  const current = routes[path] || routes.dashboard;
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl border bg-white p-3">
        <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Your account
        </p>
        {[
          ["dashboard", "Overview"],
          ["my-pets", "My pet listings"],
          ["create-pet", "Create listing"],
          ["applications", "My applications"],
          ["donations", "My donations"],
          ["my-reports", "My reports"],
          ["seller-applications", "Applications received"],
          ["payments", "Payments"],
          ["seller-payments", "Seller payments"],
          ["messages", "Messages"],
          ["edit-profile", "My profile"],
        ].map(([slug, label]) => (
          <Link
            key={slug}
            className={`block rounded-xl px-3 py-2 text-sm ${path === slug ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
            href={slug === "dashboard" ? "/dashboard" : `/dashboard/${slug}`}
          >
            {label}
          </Link>
        ))}
      </aside>
      <main>
        {path === "edit-profile" ? (
          <ProfilePage profile={profile} setProfile={setProfile} />
        ) : path === "create-pet" ? (
          <CreatePet />
        ) : path === "new-report" ? (
          <CreateReport />
        ) : path === "my-pets" && petId && mediaId ? (
          <>
            <PageTitle
              title="Manage pet media"
              description={`Manage images and videos for pet listing ${petId}.`}
            />
            <PetMedia
              id={petId}
              profile={profile}
              isAdmin={auth?.user?.role === "admin"}
            />
          </>
        ) : path === "my-pets" && petId ? (
          <EditPet id={petId} />
        ) : path === "my-pets" ? (
          <DataPage
            title={current[0]}
            description={current[1]}
            load={(page) => petService.mine(page)}
            columns={[
              { key: "name", label: "Pet" },
              { key: "listing_type", label: "Type" },
              { key: "status", label: "Status" },
              {
                key: "id",
                label: "Media",
                render: (r) => (
                  <Link
                    className="text-blue-600"
                    href={`/dashboard/my-pets/${r.id}/media`}
                  >
                    Manage media
                  </Link>
                ),
              },
              {
                key: "id",
                label: "Actions",
                render: (r) => <PetListingActions pet={r} />,
              },
            ]}
          />
        ) : path === "applications" && applicationId ? (
          <ApplicationDetail id={applicationId} />
        ) : path === "donations" ? (
          <Donations />
        ) : path === "my-reports" ? (
          <>
            <PageTitle title={current[0]} description={current[1]} />
            <Notice>
              Unavailable: the backend has no endpoint to list reports owned by
              the current user. Public active reports and report create, detail,
              update, status, and delete endpoints exist, but this page cannot
              safely discover your report IDs.
            </Notice>
          </>
        ) : path === "applications" ? (
          <DataPage
            title={current[0]}
            description={current[1]}
            load={(page) => applicationService.mine(page)}
            columns={[
              {
                key: "id",
                label: "Application",
                render: (r) => (
                  <Link
                    className="text-blue-600"
                    href={`/dashboard/applications/${r.id}`}
                  >
                    #{r.id}
                  </Link>
                ),
              },
              { key: "pet_id", label: "Pet ID" },
              { key: "status", label: "Status" },
              { key: "created_at", label: "Date" },
            ]}
          />
        ) : path === "seller-applications" ? (
          <ApplicationsReceived />
        ) : path === "payments" || path === "seller-payments" ? (
          <DataPage
            title={current[0]}
            description={current[1]}
            load={(page) =>
              path === "payments"
                ? paymentService.mine(page)
                : paymentService.seller(page)
            }
            columns={[
              { key: "id", label: "Payment" },
              { key: "payment_type", label: "Type" },
              { key: "amount", label: "Amount" },
              { key: "payment_method", label: "Method" },
              { key: "status", label: "Status" },
              ...(path === "seller-payments"
                ? [
                    {
                      key: "id",
                      label: "Action",
                      render: (r) =>
                        r.status === "pending" &&
                        r.payment_method === "cash" ? (
                          <Button
                            variant="outline"
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  "Confirm that you received this cash payment? This marks it as paid.",
                                )
                              )
                                return;
                              try {
                                await paymentService.confirmCash(r.id);
                                window.location.reload();
                              } catch (e) {
                                alert(e.message);
                              }
                            }}
                          >
                            Confirm cash
                          </Button>
                        ) : (
                          "—"
                        ),
                    },
                  ]
                : []),
            ]}
          />
        ) : path === "messages" ? (
          <Messages profile={profile} />
        ) : (
          <>
            <PageTitle title="Your Petopia" description={current[1]} />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ["My pet listings", "/dashboard/my-pets", PawPrint],
                ["Applications", "/dashboard/applications", Heart],
                ["Payments", "/dashboard/payments", CircleDollarSign],
                ["Messages", "/dashboard/messages", MessageCircle],
                ["Profile", "/dashboard/edit-profile", UserRound],
                ["Report a pet", "/dashboard/new-report", Plus],
              ].map(([t, u, Icon]) => (
                <Link href={u} key={u}>
                  <Card className="h-full hover:border-blue-200">
                    <CardContent>
                      <Icon className="mb-5 text-blue-600" />
                      <h2 className="font-semibold">{t}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Open and manage
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {profile ? (
              <Notice kind="success">
                {auth?.user?.email || "Signed in"} / {profile.full_name}
              </Notice>
            ) : (
              <Notice>
                This account has no trusted Petopia profile mapping. Google
                OAuth users need an administrator to provision
                `app_metadata.profile_id` before profile-dependent features are
                available. Email/password registration through Petopia creates
                this mapping automatically.
              </Notice>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export function ApplicationsReceived() {
  const [petId, setPetId] = useState(""),
    [rows, setRows] = useState([]),
    [error, setError] = useState("");
  const search = async () => {
    try {
      setError("");
      const r = await applicationService.forPet(petId, {
        limit: 50,
        offset: 0,
      });
      setRows(asArray(r.data));
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <>
      <PageTitle
        title="Applications received"
        description="Enter one of your pet listing IDs. The API lists applications per owned pet."
      />
      <div className="mb-4 flex max-w-md gap-2">
        <Input
          value={petId}
          onChange={(e) => setPetId(e.target.value)}
          placeholder="Pet listing ID"
        />
        <Button onClick={search}>Load</Button>
      </div>
      {error && <Notice>{error}</Notice>}
      {rows.length === 0 ? (
        <Empty label="No applications loaded. Enter an owned pet ID to check." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent>
                <p className="font-semibold">
                  Application #{r.id} · {r.status}
                </p>
                <p className="my-2 text-sm text-slate-600">
                  {r.message || "No message"}
                </p>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          await applicationService.status(r.id, "approved");
                          search();
                        } catch (e) {
                          setError(e.message);
                        }
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await applicationService.status(r.id, "rejected");
                          search();
                        } catch (e) {
                          setError(e.message);
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export function Donations() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    paymentService
      .mine({ limit: 100, offset: 0 })
      .then((r) =>
        setRows(asArray(r.data).filter((p) => p.payment_type === "donation")),
      )
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }, []);
  return (
    <>
      <PageTitle
        title="My donations"
        description="Donation payment records returned by the payments API."
      />
      {error && <Notice>{error}</Notice>}
      {busy ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty label="No donation payments found." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">#{row.id}</td>
                  <td className="px-4 py-3">{row.campaign_id || "—"}</td>
                  <td className="px-4 py-3">
                    {row.amount} {row.currency}
                  </td>
                  <td className="px-4 py-3">{row.payment_method}</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function AdminTools() {
  const [profileId, setProfileId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [campaign, setCampaign] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const decideSeller = async (status) => {
    try {
      if (!/^\d+$/.test(profileId))
        throw new Error("Enter a valid numeric profile ID.");
      setError("");
      await profileService.decide(profileId, status);
      setMessage(`Seller verification marked ${status}.`);
    } catch (e) {
      setError(e.message);
    }
  };
  const lookupCampaign = async () => {
    try {
      if (!/^\d+$/.test(campaignId))
        throw new Error("Enter a valid numeric campaign ID.");
      setError("");
      const result = await fundraisingService.get(campaignId);
      setCampaign(result.data);
    } catch (e) {
      setError(e.message);
      setCampaign(null);
    }
  };
  const decideCampaign = async (status) => {
    try {
      if (!/^\d+$/.test(campaignId))
        throw new Error("Enter a valid numeric campaign ID.");
      setError("");
      const result = await fundraisingService.review(campaignId, status);
      setCampaign(result.data);
      setMessage(`Campaign marked ${status}.`);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <>
      <PageTitle
        title="Admin review"
        description="The API supports seller verification decisions and campaign review. It does not provide queues or general user management."
      />
      {error && <Notice>{error}</Notice>}
      {message && <Notice kind="success">{message}</Notice>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="font-semibold">Seller verification</h2>
            <p className="my-2 text-sm text-slate-500">
              Enter a profile ID to mark its verification verified or rejected.
            </p>
            <Input
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              placeholder="Profile ID"
            />
            <div className="mt-3 flex gap-2">
              <Button onClick={() => decideSeller("verified")}>Verify</Button>
              <Button
                variant="outline"
                onClick={() => decideSeller("rejected")}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="font-semibold">Fundraising campaign review</h2>
            <p className="my-2 text-sm text-slate-500">
              Enter a campaign ID; the API allows admins to retrieve and review
              campaign records.
            </p>
            <div className="flex gap-2">
              <Input
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="Campaign ID"
              />
              <Button variant="outline" onClick={lookupCampaign}>
                Load
              </Button>
            </div>
            {campaign && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <strong>{campaign.title}</strong>
                <p className="text-sm text-slate-500">
                  Status: {campaign.status}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => decideCampaign("active")}>
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => decideCampaign("rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function Messages({ profile }) {
  const [items, setItems] = useState([]),
    [error, setError] = useState(""),
    [peer, setPeer] = useState(""),
    [rows, setRows] = useState([]),
    [body, setBody] = useState(""),
    [unread, setUnread] = useState(0);
  useEffect(() => {
    messageService
      .conversations()
      .then((r) => setItems(asArray(r.data)))
      .catch((e) => setError(e.message));
    messageService
      .unread()
      .then((r) => setUnread(Number(r.data?.count || 0)))
      .catch((e) => setError(e.message));
  }, []);
  const open = async (id) => {
    setPeer(String(id));
    try {
      const r = await messageService.conversation(id, { limit: 50, offset: 0 });
      const messages = asArray(r.data);
      const unreadIncoming = messages.filter(
        (message) =>
          String(message.receiver_id) === String(profile?.id) &&
          !message.is_read,
      );
      await Promise.all(
        unreadIncoming.map((message) => messageService.read(message.id)),
      );
      setRows(
        messages.map((message) =>
          unreadIncoming.some((incoming) => incoming.id === message.id)
            ? { ...message, is_read: true }
            : message,
        ),
      );
      if (unreadIncoming.length)
        setUnread((value) => Math.max(0, value - unreadIncoming.length));
    } catch (e) {
      setError(e.message);
    }
  };
  const send = async () => {
    if (!/^\d+$/.test(peer) || !body.trim()) {
      setError("Enter a numeric profile ID and a message.");
      return;
    }
    if (String(profile?.id) === peer) {
      setError("You cannot message yourself.");
      return;
    }
    try {
      await messageService.send({ receiver_id: peer, message: body });
      setBody("");
      open(peer);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <>
      <PageTitle
        title="Messages"
        description="Choose a conversation, or enter the other person's profile ID to read a thread."
      />
      <p className="mb-4 text-sm text-slate-500">Unread messages: {unread}</p>
      {error && <Notice>{error}</Notice>}
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <div className="space-y-2">
          {items.map((i) => (
            <button
              onClick={() => open(i.peer_id)}
              key={i.peer_id}
              className="w-full rounded-xl border bg-white p-3 text-left text-sm"
            >
              Conversation with profile {i.peer_id}
              <br />
              <span className="text-slate-500">{i.message}</span>
            </button>
          ))}
          <Input
            value={peer}
            onChange={(e) => setPeer(e.target.value)}
            placeholder="Profile ID"
          />
          <Button variant="outline" onClick={() => open(peer)}>
            Open conversation
          </Button>
        </div>
        <Card>
          <CardContent>
            <div className="max-h-80 space-y-3 overflow-y-auto">
              {rows.map((r, i) => (
                <div
                  key={r.id || i}
                  className="rounded-xl bg-slate-50 p-3 text-sm"
                >
                  {r.message}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a message"
                maxLength={5000}
              />
              <Button onClick={send}>Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
