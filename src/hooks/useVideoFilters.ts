"use client";

import { useMemo } from "react";
import { Video, VideoFilter } from "@/types";

function filterByText(video: Video, filter: VideoFilter): boolean {
  if (!filter.searchText) return true;

  const search = filter.searchText.toLowerCase();

  if (filter.searchInTitle && video.title.toLowerCase().includes(search)) {
    return true;
  }
  if (
    filter.searchInDescription &&
    video.description?.toLowerCase().includes(search)
  ) {
    return true;
  }
  if (
    filter.searchInChannel &&
    video.channelTitle.toLowerCase().includes(search)
  ) {
    return true;
  }

  return false;
}

export function applyFilters(videos: Video[], filter: VideoFilter): Video[] {
  return videos.filter((video) => {
    // Filtro de texto
    if (!filterByText(video, filter)) return false;

    // Filtro de idioma
    if (
      filter.selectedLanguage &&
      filter.selectedLanguage !== "all" &&
      video.language !== filter.selectedLanguage
    ) {
      return false;
    }

    // Filtro de duração
    if (video.durationInSeconds < filter.minDuration) return false;
    if (
      filter.maxDuration !== Infinity &&
      video.durationInSeconds > filter.maxDuration
    ) {
      return false;
    }

    // Filtro de visualizações
    if (video.viewCount < filter.minViewCount) return false;
    if (
      filter.maxViewCount !== Infinity &&
      video.viewCount > filter.maxViewCount
    ) {
      return false;
    }

    return true;
  });
}

export function useVideoFilters(videos: Video[], filter: VideoFilter) {
  const filteredVideos = useMemo(() => {
    return applyFilters(videos, filter);
  }, [videos, filter]);

  const availableLanguages = useMemo(() => {
    const languages = new Set<string>();
    videos.forEach((video) => {
      if (video.language) {
        languages.add(video.language);
      }
    });
    return Array.from(languages).sort();
  }, [videos]);

  return { filteredVideos, availableLanguages };
}
