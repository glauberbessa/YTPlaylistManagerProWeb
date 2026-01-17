"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { Video } from "@/types/video";
import { formatDuration, formatViewCount, formatDate, getLanguageName } from "@/lib/utils";
import { UI_TEXT } from "@/lib/i18n";

interface VideoTableProps {
  videos: Video[];
  selectedVideos: Set<string>;
  onToggleSelect: (videoId: string) => void;
  onToggleSelectAll: () => void;
}

export function VideoTable({
  videos,
  selectedVideos,
  onToggleSelect,
  onToggleSelectAll,
}: VideoTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const allSelected = useMemo(
    () => videos.length > 0 && videos.every((v) => selectedVideos.has(v.id)),
    [videos, selectedVideos]
  );

  const columns = useMemo<ColumnDef<Video>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={allSelected}
            onCheckedChange={onToggleSelectAll}
            aria-label="Selecionar todos"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedVideos.has(row.original.id)}
            onCheckedChange={() => onToggleSelect(row.original.id)}
            aria-label="Selecionar vídeo"
          />
        ),
        enableSorting: false,
      },
      {
        id: "thumbnail",
        header: UI_TEXT.columns.thumbnail,
        cell: ({ row }) => (
          <div className="relative h-12 w-20 overflow-hidden rounded">
            {row.original.thumbnailUrl ? (
              <Image
                src={row.original.thumbnailUrl}
                alt={row.original.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="text-xs text-muted-foreground">N/A</span>
              </div>
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {UI_TEXT.columns.title}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="max-w-[300px]">
            <a
              href={`https://www.youtube.com/watch?v=${row.original.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary"
            >
              <span className="truncate">{row.original.title}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        ),
      },
      {
        accessorKey: "channelTitle",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {UI_TEXT.columns.channel}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="max-w-[150px] truncate block">
            {row.original.channelTitle}
          </span>
        ),
      },
      {
        accessorKey: "durationInSeconds",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {UI_TEXT.columns.duration}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatDuration(row.original.durationInSeconds),
      },
      {
        accessorKey: "viewCount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {UI_TEXT.columns.views}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatViewCount(row.original.viewCount),
      },
      {
        accessorKey: "publishedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {UI_TEXT.columns.published}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) =>
          row.original.publishedAt ? formatDate(row.original.publishedAt) : "-",
      },
      {
        accessorKey: "language",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {UI_TEXT.columns.language}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) =>
          row.original.language
            ? getLanguageName(row.original.language)
            : "Desconhecido",
      },
    ],
    [allSelected, onToggleSelect, onToggleSelectAll, selectedVideos]
  );

  const table = useReactTable({
    data: videos,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={selectedVideos.has(row.original.id) && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {UI_TEXT.playlists.noVideos}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
