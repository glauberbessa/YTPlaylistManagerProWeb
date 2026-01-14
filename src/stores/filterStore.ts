import { create } from "zustand";
import {
  VideoFilter,
  DEFAULT_FILTER,
  DurationPreset,
  ViewCountPreset,
  DURATION_PRESETS,
  VIEW_COUNT_PRESETS,
} from "@/types/filter";

interface FilterState {
  filter: VideoFilter;
  durationPreset: DurationPreset;
  viewCountPreset: ViewCountPreset;
  setSearchText: (text: string) => void;
  setSearchInTitle: (value: boolean) => void;
  setSearchInDescription: (value: boolean) => void;
  setSearchInChannel: (value: boolean) => void;
  setSelectedLanguage: (language: string) => void;
  setDurationPreset: (preset: DurationPreset) => void;
  setMinDuration: (seconds: number) => void;
  setMaxDuration: (seconds: number) => void;
  setViewCountPreset: (preset: ViewCountPreset) => void;
  setMinViewCount: (count: number) => void;
  setMaxViewCount: (count: number) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  filter: DEFAULT_FILTER,
  durationPreset: "all",
  viewCountPreset: "all",

  setSearchText: (text) =>
    set((state) => ({
      filter: { ...state.filter, searchText: text },
    })),

  setSearchInTitle: (value) =>
    set((state) => ({
      filter: { ...state.filter, searchInTitle: value },
    })),

  setSearchInDescription: (value) =>
    set((state) => ({
      filter: { ...state.filter, searchInDescription: value },
    })),

  setSearchInChannel: (value) =>
    set((state) => ({
      filter: { ...state.filter, searchInChannel: value },
    })),

  setSelectedLanguage: (language) =>
    set((state) => ({
      filter: { ...state.filter, selectedLanguage: language },
    })),

  setDurationPreset: (preset) =>
    set((state) => ({
      durationPreset: preset,
      filter: {
        ...state.filter,
        minDuration: DURATION_PRESETS[preset].min,
        maxDuration: DURATION_PRESETS[preset].max,
      },
    })),

  setMinDuration: (seconds) =>
    set((state) => ({
      durationPreset: "all",
      filter: { ...state.filter, minDuration: seconds },
    })),

  setMaxDuration: (seconds) =>
    set((state) => ({
      durationPreset: "all",
      filter: { ...state.filter, maxDuration: seconds },
    })),

  setViewCountPreset: (preset) =>
    set((state) => ({
      viewCountPreset: preset,
      filter: {
        ...state.filter,
        minViewCount: VIEW_COUNT_PRESETS[preset].min,
        maxViewCount: VIEW_COUNT_PRESETS[preset].max,
      },
    })),

  setMinViewCount: (count) =>
    set((state) => ({
      viewCountPreset: "all",
      filter: { ...state.filter, minViewCount: count },
    })),

  setMaxViewCount: (count) =>
    set((state) => ({
      viewCountPreset: "all",
      filter: { ...state.filter, maxViewCount: count },
    })),

  resetFilters: () =>
    set({
      filter: DEFAULT_FILTER,
      durationPreset: "all",
      viewCountPreset: "all",
    }),
}));
