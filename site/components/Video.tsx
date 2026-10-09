// A film's web version: controls, no autoplay, poster frame, intrinsic size so the page doesn't jump.
export default function Video({ src, poster, width, height, label }: { src: string; poster?: string; width: number; height: number; label: string }) {
  return (
    <div className="player">
      <video controls playsInline preload="metadata" poster={poster} width={width} height={height} aria-label={label}>
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
