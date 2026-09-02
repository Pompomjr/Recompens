"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

/**
 * cf SPEC §10 — "La caméra du téléphone s'ouvre. QR détecté."
 *
 * Le composant ne fait que LIRE l'image et remonter le token trouvé. Il ne
 * décide rien : c'est le serveur qui vérifie à qui appartient la carte
 * (cf SPEC §5).
 *
 * Note navigateur : `getUserMedia` n'est disponible qu'en contexte sécurisé,
 * c'est-à-dire en HTTPS ou sur localhost. Sur une IP de réseau local en HTTP,
 * l'appel échoue — d'où le message d'erreur explicite et la saisie manuelle
 * proposée par la page appelante.
 */
export function QrScanner({
  onDetected,
  paused,
}: {
  onDetected: (qrToken: string) => void;
  paused: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  // Évite de renvoyer cinquante fois le même token: la boucle tourne à la
  // fréquence d'affichage, le QR reste devant l'objectif plusieurs secondes.
  const lastTokenRef = useRef<string | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (paused) {
      stopCamera();
      return;
    }

    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Ce navigateur ne donne pas accès à la caméra. Utilisez la saisie manuelle ci-dessous."
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // Caméra arrière sur téléphone.
          video: { facingMode: "environment" },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        setCameraError(null);
        frameRef.current = requestAnimationFrame(tick);
      } catch {
        setCameraError(
          "Caméra indisponible : accès refusé, ou page ouverte sans HTTPS. Utilisez la saisie manuelle ci-dessous."
        );
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(image.data, image.width, image.height, {
        inversionAttempts: "dontInvert",
      });

      const token = code?.data?.trim();
      if (token && token !== lastTokenRef.current) {
        lastTokenRef.current = token;
        onDetected(token);
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [paused, onDetected, stopCamera]);

  if (cameraError) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200"
      >
        {cameraError}
      </p>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="aspect-square w-full object-cover"
      />
      {/* Repère de visée: purement visuel. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-2/3 w-2/3 rounded-xl border-2 border-white/80" />
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
