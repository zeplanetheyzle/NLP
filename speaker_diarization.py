"""
K-means 기반 화자 분리(Speaker Diarization) 예제
------------------------------------------------
파이프라인:
  1. 오디오 로드
  2. MFCC 특징 추출
  3. 고정 길이 세그먼트로 분할
  4. 각 세그먼트의 평균 MFCC 벡터 계산
  5. K-means 클러스터링으로 세그먼트를 K개 화자로 군집
  6. 세그먼트별 화자 라벨과 시간 구간 출력

의존성:
  pip install numpy librosa scikit-learn
"""

import numpy as np
import librosa
from sklearn.cluster import KMeans


def extract_segment_features(y, sr, seg_len=1.0, hop=0.5):
    """오디오를 세그먼트로 나누고 각 세그먼트의 평균 MFCC 벡터를 반환한다."""
    seg_samples = int(seg_len * sr)
    hop_samples = int(hop * sr)
    n_mfcc = 13

    segments = []
    features = []
    for start in range(0, len(y) - seg_samples + 1, hop_samples):
        seg = y[start:start + seg_samples]
        mfcc = librosa.feature.mfcc(y=seg, sr=sr, n_mfcc=n_mfcc)
        # 각 세그먼트의 시간 구간 (초)
        t_start = start / sr
        t_end = (start + seg_samples) / sr
        segments.append((t_start, t_end))
        features.append(mfcc.mean(axis=1))

    return np.array(features), segments


def diarize(audio_path, n_speakers=2, seg_len=1.0, hop=0.5, random_state=42):
    """오디오 파일에서 화자 분리를 수행한다."""
    y, sr = librosa.load(audio_path, sr=16000, mono=True)

    features, segments = extract_segment_features(y, sr, seg_len, hop)
    if len(features) == 0:
        raise ValueError("오디오가 너무 짧아 세그먼트를 만들 수 없습니다.")

    # K-means로 세그먼트 클러스터링 (각 클러스터 = 한 명의 화자)
    kmeans = KMeans(n_clusters=n_speakers, random_state=random_state, n_init=10)
    labels = kmeans.fit_predict(features)

    return labels, segments, sr


def format_timeline(labels, segments):
    """화자 라벨과 시간 구간을 가독성 있게 문자열로 만든다."""
    lines = []
    prev = None
    for label, (t_start, t_end) in zip(labels, segments):
        if label != prev:
            lines.append(f"[{t_start:6.2f}s - {t_end:6.2f}s] 화자 {label}")
            prev = label
        else:
            lines[-1] = f"[{t_start:6.2f}s - {t_end:6.2f}s] 화자 {label}"
    return "\n".join(lines)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("사용법: python speaker_diarization.py <audio_file> [n_speakers]")
        sys.exit(1)

    audio_path = sys.argv[1]
    n_speakers = int(sys.argv[2]) if len(sys.argv) > 2 else 2

    labels, segments, sr = diarize(audio_path, n_speakers=n_speakers)
    print(format_timeline(labels, segments))
