// Rendered markdown (built at export time from the synced course files).
export default function Prose({ html }: { html: string }) {
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
