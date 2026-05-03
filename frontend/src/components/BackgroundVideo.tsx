const BACKGROUND_VIDEO_URL =
  "https://uiuiui.storage.clo.ru/files/wally/1009671.mp4";

export function BackgroundVideo() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-background" aria-hidden="true">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover z-0"
      >
        <source src={BACKGROUND_VIDEO_URL} type="video/mp4" />
      </video>
      <div className="absolute inset-0 z-[1] bg-[#001722]/70" />
      <div className="cinematic-shadow absolute inset-0 z-[2]" />
    </div>
  );
}
