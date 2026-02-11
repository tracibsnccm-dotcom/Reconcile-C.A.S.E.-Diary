import { RCMS } from "../constants/brand";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold" style={{color: RCMS.brandNavy}}>404</h1>
        <p className="mt-2 text-muted-foreground">That page was not found.</p>
        <a href="/" className="mt-4 inline-block underline" style={{ color: RCMS.brandTeal }}>
          Go home
        </a>
      </div>
    </div>
  );
}
