import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

function Icon({ children }) {
  return (
    <span className="material-symbols-outlined notranslate" aria-hidden="true" translate="no">
      {children}
    </span>
  );
}

export default function DocumentViewerPage() {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("src") || "";
  const documentName = searchParams.get("name") || "Dokumen Rasmi DBKU.pdf";

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Slide 1";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="document-viewer-page">
      <header className="document-viewer-toolbar">
        <div className="document-viewer-title">
          <Icon>menu</Icon>
          <strong>Slide 1</strong>
        </div>
        {source ? (
          <a href={source} download={documentName} aria-label="Muat turun dokumen">
            <Icon>download</Icon>
          </a>
        ) : null}
      </header>
      {source ? (
        <iframe src={`${source}#toolbar=0`} title={documentName} />
      ) : (
        <section className="document-viewer-empty">
          <h1>Dokumen tidak dapat dibuka</h1>
          <p>Sila kembali ke portal dan cuba semula.</p>
        </section>
      )}
    </main>
  );
}
