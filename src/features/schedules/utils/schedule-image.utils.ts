import { toBlob } from "html-to-image";

export interface ScheduleImageOptions {
  element: HTMLElement;
  filename: string;
}

export type ImageShareResult = "SHARED" | "UNSUPPORTED" | "CANCELLED";

function normalizeFilename(filename: string): string {
  const normalized = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${normalized || "escala-lar"}.png`;
}

export async function generateScheduleImage({
  element,
  filename,
}: ScheduleImageOptions): Promise<File> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const blob = await toBlob(element, {
    pixelRatio: 2,
    backgroundColor: "#F4F8F3",
    cacheBust: true,
  });

  if (!blob) {
    throw new Error("Não foi possível gerar a imagem da escala.");
  }

  return new File([blob], normalizeFilename(filename), {
    type: "image/png",
  });
}

export function downloadScheduleImage(file: File): void {
  const url = URL.createObjectURL(file);

  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function shareScheduleImage(
  file: File,
): Promise<ImageShareResult> {
  if (
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function" ||
    !navigator.canShare({ files: [file] })
  ) {
    return "UNSUPPORTED";
  }

  try {
    await navigator.share({
      title: "Escala LAR",
      text: "Programação dos encontros do LAR",
      files: [file],
    });

    return "SHARED";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "CANCELLED";
    }

    throw error;
  }
}
