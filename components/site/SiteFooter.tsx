import { ArrowUp, ArrowUpRight } from "./Icons";

export function SiteFooter() {
  return (
    <footer id="enquire" className="bg-panel text-panel-ink">
      <div className="container-wide py-10 md:py-16">
        <div className="flex items-center justify-between gap-4 border-t border-panel-line pt-4">
          <p className="type-eyebrow">Enquire</p>
          <p className="type-micro text-panel-muted">
            Private viewings, seven days
          </p>
        </div>

        <div className="mt-10 grid gap-12 md:mt-16 md:grid-cols-12">
          <div className="md:col-span-7">
            <h2 className="type-footer max-w-[618px] text-balance">
              Space, considered.
            </h2>
            <p className="mt-5 max-w-[420px] text-panel-muted">
              Residences shaped by architecture, light, and material. Tell us
              which part of the coast you are drawn to — we will send three
              homes worth your time, not thirty.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <a
                href="mailto:hello@zarastudio.in?subject=Project%20enquiry"
                className="pill pill-dark"
              >
                Book a private viewing
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@zarastudio.in"
                className="link-under text-[14px]"
              >
                hello@zarastudio.in
              </a>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 md:col-span-4 md:col-start-9">
            <div>
              <p className="type-micro text-panel-muted">Enquiries</p>
              <a
                href="mailto:hello@zarastudio.in"
                className="mt-3 block text-[14px] leading-6 underline decoration-[#2a2725]/25 underline-offset-4 transition-opacity duration-300 hover:opacity-60"
              >
                hello@zarastudio.in
              </a>
              <a
                href="tel:+919820147386"
                className="mt-1 block text-[14px] leading-6 transition-opacity duration-300 hover:opacity-60"
              >
                +91 98201 47386
              </a>
            </div>

            <div>
              <p className="type-micro text-panel-muted">Studio</p>
              <p className="mt-3 text-[14px] leading-6">
                12 Badem Road, Assagao
                <br />
                Goa 403507, India
              </p>
            </div>

            <div>
              <p className="type-micro text-panel-muted">Hours</p>
              <p className="mt-3 text-[14px] leading-6">
                Monday–Saturday
                <br />
                By appointment
              </p>
            </div>

            <div>
              <p className="type-micro text-panel-muted">Language</p>
              <p className="mt-3 text-[14px] leading-6">
                English, Konkani, Hindi
                <br />
                Portuguese on request
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-panel-line pt-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="type-micro">© 2026 ZARA</p>
              <a
                href="https://www.zynhyr.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Made by Zynhyr (opens zynhyr.com in a new tab)"
                className="group mt-1 inline-flex min-h-[40px] w-fit items-baseline gap-2 py-1.5 text-[12px] uppercase tracking-[0.12em] text-panel-ink/70"
              >
                <span>Made by</span>
                <img
                  src="/images/zynhyr-logo-light.png"
                  alt="Zynhyr"
                  width={80}
                  height={22}
                  className="h-auto w-[80px] opacity-[0.85] transition-opacity duration-300 group-hover:opacity-100"
                />
              </a>
              <p className="max-w-[520px] text-[11px] leading-4 text-panel-muted">
                Placeholder study: copy and photography belong to the reference
                site and are used here for layout only. Replace before
                publication.
              </p>
            </div>

            <a
              href="#top"
              className="pill pill-cream min-h-[40px] shrink-0 self-start px-4 text-[12px] tracking-[0.08em] sm:self-auto"
            >
              ZARA
              <ArrowUp className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
