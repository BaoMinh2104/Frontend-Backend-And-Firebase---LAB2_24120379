import { Image as ImageIcon } from "lucide-react";
import type { CaptionRecord } from "@/lib/types";

type CaptionRecordCardProps = {
  record: CaptionRecord;
};

export function CaptionRecordCard({ record }: CaptionRecordCardProps) {
  return (
    <article className="liquid-glass rounded-lg p-4 shadow-xl shadow-black/18">
      <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-lg bg-black/20">
          {record.thumbnail_data_url ? (
            <img
              src={record.thumbnail_data_url}
              alt={record.caption}
              className="h-[120px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[120px] items-center justify-center text-white/45">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-white/45">
            <span>{record.filename}</span>
            <span>•</span>
            <span>{record.content_type}</span>
          </div>

          {record.prompt ? (
            <p className="text-sm text-white/72">
              <span className="font-medium text-white">Prompt:</span> {record.prompt}
            </p>
          ) : null}

          <p className="text-base leading-relaxed text-white">
            <span className="font-medium">Caption:</span> {record.caption}
          </p>

          {record.created_at ? (
            <p className="text-xs text-white/42">{new Date(record.created_at).toLocaleString()}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
