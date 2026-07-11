"""
SpeechBrain 사전학습 x-vector 임베딩 + K-means 화자 분리
------------------------------------------------------
화자 판별용으로 학습된 x-vector 임베딩을 추출한 뒤 K-means로 군집하여
MFCC 평균 벡터 방식보다 정확도를 높인다.

의존성:
  pip install numpy torchaudio speechbrain

모델: speechbrain/spkrec-xvect-voxceleb (VoxCeleb로 학습된 x-vector)
"""

import numpy as np
import torch
import torchaudio
from speechbrain.pretrained import SpeakerRecognition
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


class XVectorDiarizer:
    def __init__(self, model_source="speechbrain/spkrec-xvect-voxceleb",
                 seg_len=1.5, hop=0.75, device=None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.verification = SpeakerRecognition.from_hparams(
            source=model_source,
            savedir="pretrained_models/spkrec-xvect-voxceleb",
            run_opts={"device": self.device},
        )
        self.seg_len = seg_len
        self.hop = hop

    def _load(self, audio_path, sr=16000):
        """torchaudio로 모노 16kHz 텐서 로드."""
        wav, file_sr = torchaudio.load(audio_path)
        if wav.shape[0] > 1:
            wav = wav.mean(dim=0, keepdim=True)
        if file_sr != sr:
            wav = torchaudio.functional.resample(wav, file_sr, sr)
        return wav.squeeze(0), sr

    def _segment(self, wav, sr):
        """고정 길이 세그먼트로 분할 (시간 구간과 함께)."""
        seg_samples = int(self.seg_len * sr)
        hop_samples = int(self.hop * sr)
        segs, bounds = [], []
        for start in range(0, len(wav) - seg_samples + 1, hop_samples):
            segs.append(wav[start:start + seg_samples])
            bounds.append((start / sr, (start + seg_samples) / sr))
        return segs, bounds

    def extract_embeddings(self, audio_path):
        """각 세그먼트의 x-vector 임베딩을 추출한다."""
        wav, sr = self._load(audio_path)
        segs, bounds = self._segment(wav, sr)
        if not segs:
            raise ValueError("오디오가 세그먼트 길이보다 짧습니다.")

        emb_list = []
        with torch.no_grad():
            for seg in segs:
                seg = seg.unsqueeze(0).to(self.device)  # (1, T)
                emb = self.verification.encode_batch(seg)  # (1, 1, D)
                emb_list.append(emb.squeeze().cpu().numpy())
        return np.array(emb_list), bounds

    def diarize(self, audio_path, n_speakers=2, random_state=42):
        """임베딩 추출 → 정규화 → K-means 군집."""
        embeddings, bounds = self.extract_embeddings(audio_path)

        # 임베딩 정규화는 x-vector 유사도 비교에 중요
        scaler = StandardScaler()
        X = scaler.fit_transform(embeddings)

        kmeans = KMeans(n_clusters=n_speakers, random_state=random_state,
                        n_init=20)
        labels = kmeans.fit_predict(X)
        return labels, bounds


def format_timeline(labels, bounds):
    lines = []
    prev = None
    for label, (t0, t1) in zip(labels, bounds):
        line = f"[{t0:6.2f}s - {t1:6.2f}s] 화자 {label}"
        if label != prev:
            lines.append(line)
            prev = label
        else:
            lines[-1] = line
    return "\n".join(lines)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("사용법: python speaker_diarization_xvector.py <audio_file> [n_speakers]")
        sys.exit(1)

    audio_path = sys.argv[1]
    n_speakers = int(sys.argv[2]) if len(sys.argv) > 2 else 2

    diarizer = XVectorDiarizer()
    labels, bounds = diarizer.diarize(audio_path, n_speakers=n_speakers)
    print(format_timeline(labels, bounds))
