"use client";

type Props = {
  resultImageUrl: string;
  fineTuningPrompt: string;
  fineTuningLoading: boolean;
  onDownload: () => void;
  onFineTune: () => void;
  onChangeFineTuningPrompt: (next: string) => void;
};

export default function GeneratedImagePanel({
  resultImageUrl,
  fineTuningPrompt,
  fineTuningLoading,
  onDownload,
  onFineTune,
  onChangeFineTuningPrompt,
}: Props) {
  if (!resultImageUrl) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">Generated image</h3>
      <img
        src={resultImageUrl}
        alt="Generated result"
        className="w-full max-w-sm rounded-xl border"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDownload}
          className="rounded-xl border px-4 py-2 text-sm font-medium"
        >
          Download
        </button>
        <button
          type="button"
          onClick={onFineTune}
          disabled={fineTuningLoading || !fineTuningPrompt.trim()}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {fineTuningLoading ? "Fine-tuning..." : "Fine-tune"}
        </button>
      </div>
      <textarea
        value={fineTuningPrompt}
        onChange={(e) => onChangeFineTuningPrompt(e.target.value)}
        placeholder="Describe how to fine-tune this image..."
        className="rounded-xl border p-3 text-sm"
      />
    </div>
  );
}
