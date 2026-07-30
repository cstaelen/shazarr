type MusicBrainzRelease = {
  id: string;
  title: string;
  date?: string;
  "release-group"?: { id: string; title: string; "primary-type"?: string };
};

type MusicBrainzRecording = {
  id: string;
  title: string;
  releases?: MusicBrainzRelease[];
};

type MusicBrainzRecordingSearchResponse = {
  recordings?: MusicBrainzRecording[];
};

export type MusicBrainzReleaseGroup = {
  id: string;
  title: string;
  primaryType?: string;
};

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`https://musicbrainz.org/ws/2${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MusicBrainz API error (${res.status}): ${text}`);
  }
  return res.json();
}

// An ISRC identifies a recording, which can appear on several releases
// (single, album, compilation...). Each release belongs to one release-group,
// which is the stable "album" identity Lidarr expects for unambiguous lookup.
export async function getReleaseGroupsByIsrc(
  isrc: string
): Promise<MusicBrainzReleaseGroup[]> {
  if (!isrc?.trim()) return [];

  const data = await request<MusicBrainzRecordingSearchResponse>(
    `/recording?query=isrc:${encodeURIComponent(isrc)}&fmt=json&inc=releases%2Brelease-groups`
  );

  const releaseGroups = new Map<string, MusicBrainzReleaseGroup>();
  for (const recording of data.recordings ?? []) {
    for (const release of recording.releases ?? []) {
      const group = release["release-group"];
      if (group && !releaseGroups.has(group.id)) {
        releaseGroups.set(group.id, {
          id: group.id,
          title: group.title,
          primaryType: group["primary-type"],
        });
      }
    }
  }

  return Array.from(releaseGroups.values());
}
