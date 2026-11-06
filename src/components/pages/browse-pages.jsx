"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  Plus,
  Sparkles,
  ShieldCheck,
  PawPrint,
  Heart,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import {
  Notice,
  PageTitle,
  Spinner,
  Empty,
  SkeletonGrid,
} from "@/components/common/feedback";
import { asArray, titleCase } from "@/lib/format";
import { PetCard } from "@/components/pets/pet-pages";
import { ReportCard } from "@/components/lost-found/lost-found-pages";
import { CampaignCard } from "@/components/fundraising/fundraising-pages";
import { petService } from "@/services/pet.service";
import { lostFoundService } from "@/services/lost-found.service";
import { fundraisingService } from "@/services/fundraising.service";

const EMPTY_PARAMS = {};

export function Listing({ type = "pets", params = EMPTY_PARAMS }) {
  const [rows, setRows] = useState([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(params.search || ""),
    [reportType, setReportType] = useState(""),
    [offset, setOffset] = useState(0),
    [filters, setFilters] = useState({
      listingType: params.listingType || "",
    });
  const load = useCallback(
    async (extra = {}) => {
      setBusy(true);
      setError("");
      try {
        const res =
          type === "pets"
            ? await petService.list({
                ...params,
                ...extra,
                limit: 24,
                offset: extra.offset ?? 0,
              })
            : type === "reports"
              ? await lostFoundService.list({
                  ...params,
                  ...extra,
                  limit: 24,
                  offset: extra.offset ?? 0,
                })
              : await fundraisingService.list({
                  ...params,
                  ...extra,
                  limit: 24,
                  offset: extra.offset ?? 0,
                });
        const nextRows = asArray(res.data);
        setRows((previous) =>
          extra.offset > 0 ? [...previous, ...nextRows] : nextRows,
        );
        setOffset(extra.offset || 0);
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    },
    [type, params],
  );
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) load();
    });
    return () => {
      active = false;
    };
  }, [load]);
  const isPet = type === "pets";
  const report = type === "reports";
  return (
    <>
      <PageTitle
        eyebrow={
          report ? "Community support" : isPet ? "Meet your match" : "Give hope"
        }
        title={
          report
            ? "Lost & found pets"
            : isPet
              ? params.listingType
                ? `${titleCase(params.listingType)} pets`
                : "Find your new best friend"
              : "Fundraising campaigns"
        }
        description={
          report
            ? "Help bring pets home by browsing active community reports."
            : isPet
              ? "Browse real listings shared by the Petopia community."
              : "Support active campaigns for pets who need care."
        }
        action={
          (report || !isPet) && (
            <Button asChild>
              <Link href={report ? "/lost-found/new" : "/campaigns/new"}>
                <Plus size={16} />
                {report ? "Create report" : "Start a campaign"}
              </Link>
            </Button>
          )
        }
      />
      {isPet && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load({ ...filters, search, offset: 0 });
          }}
          className="mb-6 rounded-2xl border border-slate-100 bg-white p-4"
        >
          <div className="flex max-w-xl gap-2">
            <Input
              aria-label="Search pets"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description"
            />
            <Button aria-label="Search">
              <Search size={17} />
              Search
            </Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["animalType", "Animal type", ["Dog", "Cat", "Bird", "Rabbit", "Other"]],
              ["listingType", "Listing type", ["Adoption", "Sale", "Rehoming"]],
              ["gender", "Gender", ["Male", "Female"]],
              ["age", "Age", ["Baby", "Young", "Adult", "Senior"]],
            ].map(([key, label, options]) => (
              <div key={key}>
                <Label htmlFor={`filter-${key}`}>{label}</Label>
                <Select
                  id={`filter-${key}`}
                  value={filters[key] || ""}
                  onChange={(e) =>
                    setFilters((v) => ({ ...v, [key]: e.target.value }))
                  }
                >
                  <option value="">All</option>
                  {options.map((option) => (
                    <option key={option} value={option.toLowerCase()}>{option}</option>
                  ))}
                </Select>
              </div>
            ))}
            <div>
              <Label htmlFor="filter-location">Location</Label>
              <Input
                id="filter-location"
                value={filters.location || ""}
                onChange={(e) => setFilters((v) => ({ ...v, location: e.target.value }))}
                placeholder="City or area"
              />
            </div>
            {[ ["breed", "Breed"], ["minPrice", "Minimum price"], ["maxPrice", "Maximum price"] ].map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={`filter-${key}`}>{label}</Label>
                <Input
                  id={`filter-${key}`}
                  type={key.includes("Price") ? "number" : "text"}
                  min={key.includes("Price") ? "0" : undefined}
                  value={filters[key] || ""}
                  onChange={(e) => setFilters((v) => ({ ...v, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" variant="outline">Apply filters</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const cleared = { listingType: "" };
                setFilters(cleared);
                load({ ...cleared, search, offset: 0 });
              }}
            >
              Clear filters
            </Button>
          </div>
        </form>
      )}
      {report && (
        <form
          className="mb-6 grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            load({
              ...filters,
              report_type: reportType || undefined,
              offset: 0,
            });
          }}
        >
          <div>
            <Label htmlFor="report-type">Report type</Label>
            <select
              id="report-type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm"
            >
              <option value="">Lost and found</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>
          {[
            ["animal_type", "Animal type"],
            ["location", "Location"],
          ].map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={`report-${key}`}>{label}</Label>
              <Input
                id={`report-${key}`}
                value={filters[key] || ""}
                onChange={(e) =>
                  setFilters((v) => ({ ...v, [key]: e.target.value }))
                }
              />
            </div>
          ))}
          <div className="self-end">
            <Button type="submit" variant="outline">
              Apply filters
            </Button>
          </div>
        </form>
      )}
      {error && <Notice>{error}</Notice>}
      {busy ? (
        <SkeletonGrid />
      ) : rows.length === 0 ? (
        <Empty
          label={
            error
              ? "The API could not load this list. Check your API configuration and connection."
              : "No matching listings are available right now."
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((item, i) =>
            isPet ? (
              <PetCard key={item.id || i} pet={item} />
            ) : report ? (
              <ReportCard key={item.id || i} item={item} />
            ) : (
              <CampaignCard key={item.id || i} item={item} />
            ),
          )}
        </div>
      )}
      {!busy && rows.length >= 24 && (
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() =>
              load({
                search,
                ...filters,
                ...(reportType ? { report_type: reportType } : {}),
                offset: offset + 24,
              })
            }
          >
            Load more
          </Button>
        </div>
      )}
    </>
  );
}

export function Home() {
  return (
    <>
      <section className="grid items-center gap-9 overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-6 py-12 text-white sm:px-12 lg:grid-cols-[1.15fr_.85fr] lg:px-16 lg:py-16">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
            <Sparkles size={14} />A happier home starts here
          </div>
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Find a friend. <span className="text-sky-200">Change a life.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-blue-50">
            Discover pets looking for a loving home, reconnect lost pets with
            their families, and support local animal care.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-blue-700 hover:bg-blue-50">
              <Link href="/pets">
                Browse pets
                <ArrowRight size={17} />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/lost-found">Help a lost pet</Link>
            </Button>
          </div>
        </div>
        <div className="relative hidden min-h-72 items-center justify-center lg:flex">
          <div className="absolute h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute h-56 w-56 rounded-full bg-white/10" />
          <div className="relative grid h-48 w-48 place-items-center rounded-[2.5rem] bg-white text-blue-500 shadow-2xl rotate-3">
            <PawPrint size={100} />
          </div>
          <div className="absolute bottom-8 right-2 rounded-2xl bg-white px-4 py-3 text-slate-800 shadow-xl">
            <p className="text-xs text-slate-500">Your next best friend</p>
            <p className="font-bold">is waiting 🐾</p>
          </div>
        </div>
      </section>
      <section className="py-14">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">
              Explore Petopia
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              A little good goes a long way
            </h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Find a pet",
              "Browse adoption, sale, and rehoming listings.",
              PawPrint,
              "/pets",
            ],
            [
              "Adopt with care",
              "Meet pets looking for their forever home.",
              Heart,
              "/pets?listingType=adoption",
            ],
            [
              "Lost & found",
              "Help reunite a pet and their family.",
              Search,
              "/lost-found",
            ],
            [
              "Support a cause",
              "See campaigns supporting animal care.",
              CircleDollarSign,
              "/campaigns",
            ],
          ].map(([t, d, I, h]) => (
            <Link key={t} href={h}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <CardContent>
                  <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <I size={21} />
                  </div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{d}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6 sm:flex sm:items-center sm:justify-between sm:p-9">
        <div className="flex gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-blue-600">
            <ShieldCheck />
          </div>
          <div>
            <h2 className="font-bold">A community built on care</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Listings, applications, messages, and campaigns use real data from
              the Petopia API.
            </p>
          </div>
        </div>
        <Button asChild className="mt-5 sm:mt-0">
          <Link href="/register">Join Petopia</Link>
        </Button>
      </section>
    </>
  );
}
