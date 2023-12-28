export type ApiReturnType = { error: boolean; message: string };

export type ShazamioResponseType = {
  track:  ShazamioTrackType;
};

export type ShazamioTrackType = {
  genres: {primary: string}
  hub: {
    actions: ShazamActionType[];
    options: ShazamOptionType[];
    providers: ShazamProviderType[];
    type: string;
  };
  images: {
    background: string;
    coverart: string;
    coverarthq: string;
    joecolor: string;
  };
  mysahazam: {
    apple: {
      actions: ShazamActionType[];
    };
  };
  subtitle: string;
  title: string;
  type: string;
  url: string;
  urlparams: {
    "{trackartist}": string;
    "{tracktitle}": string;
  };
  sections: ShazamSectionType[];
};

type ShazamActionType = {
  name: string;
  type: string;
  uri?: string;
  id?: string;
}

type ShazamOptionType = {
  actions: ShazamActionType[];
  caption: string;
  listcaption: string;
  type: string;
  providername: string;
}

type ShazamProviderType = {
  actions: ShazamActionType[];
  caption: string;
  images: {
    default: string;
    overflow: string;
  }
  type: string;
}

type ShazamSectionType = {
  tabname: string;
  type: string;
  metadata?: [];
  metapages?: [];
  youtubeurl?: string;
}