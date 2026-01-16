import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, RotateCcw, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useFilterStore } from "@/stores/filterStore";
import { UI_TEXT } from "@/lib/i18n";
import { getLanguageName } from "@/lib/utils";
import { DURATION_PRESETS, VIEW_COUNT_PRESETS, DurationPreset, ViewCountPreset } from "@/types/filter";
import { Video } from "@/types/video";

interface VideoFiltersProps {
  availableLanguages: string[];
  videos: Video[];
}

export function VideoFilters({ availableLanguages, videos }: VideoFiltersProps) {
  const {
    filter,
    durationPreset,
    viewCountPreset,
    setSearchText,
    setSearchInTitle,
    setSearchInDescription,
    setSearchInChannel,
    setSelectedLanguage,
    setDurationPreset,
    setViewCountPreset,
    resetFilters,
  } = useFilterStore();

  const [isExpanded, setIsExpanded] = useState(false);

  // Calcular quais presets de duração têm vídeos
  const availableDurationPresets = useMemo(() => {
    const available: Record<DurationPreset, boolean> = {
      all: true,
      shorts: false,
      short: false,
      medium: false,
      long: false,
    };

    for (const video of videos) {
      const duration = video.durationInSeconds;
      if (duration >= 0 && duration < 60) available.shorts = true;
      if (duration >= 60 && duration < 300) available.short = true;
      if (duration >= 300 && duration < 1200) available.medium = true;
      if (duration >= 1200) available.long = true;
    }

    return available;
  }, [videos]);

  // Calcular quais presets de visualizações têm vídeos
  const availableViewCountPresets = useMemo(() => {
    const available: Record<ViewCountPreset, boolean> = {
      all: true,
      low: false,
      medium: false,
      high: false,
      viral: false,
    };

    for (const video of videos) {
      const viewCount = video.viewCount;
      if (viewCount >= 0 && viewCount < 1000) available.low = true;
      if (viewCount >= 1000 && viewCount < 10000) available.medium = true;
      if (viewCount >= 10000 && viewCount < 100000) available.high = true;
      if (viewCount >= 100000) available.viral = true;
    }

    return available;
  }, [videos]);

  return (
    <Card>
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {UI_TEXT.filters.title}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Busca por texto */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={UI_TEXT.filters.search}
                value={filter.searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="searchTitle"
                  checked={filter.searchInTitle}
                  onCheckedChange={(checked) => setSearchInTitle(!!checked)}
                />
                <Label htmlFor="searchTitle" className="text-sm">
                  {UI_TEXT.filters.searchInTitle}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="searchDesc"
                  checked={filter.searchInDescription}
                  onCheckedChange={(checked) => setSearchInDescription(!!checked)}
                />
                <Label htmlFor="searchDesc" className="text-sm">
                  {UI_TEXT.filters.searchInDescription}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="searchChannel"
                  checked={filter.searchInChannel}
                  onCheckedChange={(checked) => setSearchInChannel(!!checked)}
                />
                <Label htmlFor="searchChannel" className="text-sm">
                  {UI_TEXT.filters.searchInChannel}
                </Label>
              </div>
            </div>
          </div>

          {/* Idioma */}
          <div className="space-y-2">
            <Label>{UI_TEXT.filters.language}</Label>
            <Select
              value={filter.selectedLanguage}
              onValueChange={setSelectedLanguage}
            >
              <SelectTrigger>
                <SelectValue placeholder={UI_TEXT.filters.allLanguages} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{UI_TEXT.filters.allLanguages}</SelectItem>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {getLanguageName(lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label>{UI_TEXT.filters.duration}</Label>
            <ToggleGroup
              type="single"
              value={durationPreset}
              onValueChange={(value) =>
                value && setDurationPreset(value as keyof typeof DURATION_PRESETS)
              }
              className="flex-wrap justify-start"
            >
              {Object.entries(DURATION_PRESETS).map(([key, preset]) => (
                <ToggleGroupItem
                  key={key}
                  value={key}
                  size="sm"
                  disabled={!availableDurationPresets[key as DurationPreset]}
                >
                  {preset.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Visualizações */}
          <div className="space-y-2">
            <Label>{UI_TEXT.filters.views}</Label>
            <ToggleGroup
              type="single"
              value={viewCountPreset}
              onValueChange={(value) =>
                value &&
                setViewCountPreset(value as keyof typeof VIEW_COUNT_PRESETS)
              }
              className="flex-wrap justify-start"
            >
              {Object.entries(VIEW_COUNT_PRESETS).map(([key, preset]) => (
                <ToggleGroupItem
                  key={key}
                  value={key}
                  size="sm"
                  disabled={!availableViewCountPresets[key as ViewCountPreset]}
                >
                  {preset.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Botão Reset */}
          <Button variant="outline" onClick={resetFilters} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            {UI_TEXT.filters.reset}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
