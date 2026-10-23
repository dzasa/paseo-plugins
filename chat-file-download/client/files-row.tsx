import type { PluginTimelineItemProps } from "@getpaseo/plugin/client";
import { useRpc } from "@getpaseo/plugin/client";
import { Icon, useToast } from "@getpaseo/plugin/client/react-native";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { readFileChunk, type FilesRowData } from "../shared/files";
import { downloadFile } from "./download";

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesRow({ item, theme, layout }: PluginTimelineItemProps<FilesRowData>) {
  const read = useRpc(readFileChunk);
  const toast = useToast();
  const download = useMutation({
    mutationFn: (path: string) => downloadFile(read, path),
    onError: (error) => toast.error(error instanceof Error ? error.message : String(error)),
  });
  const styles = useMemo(
    () => ({
      row: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 6 },
      chip: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 6,
        paddingVertical: layout.compact ? 6 : 4,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 999,
        backgroundColor: theme.colors.surface1,
        maxWidth: "100%" as const,
      },
      label: { color: theme.colors.foreground, fontSize: 13, flexShrink: 1 },
      size: { color: theme.colors.foregroundMuted, fontSize: 12 },
    }),
    [theme, layout.compact],
  );
  return (
    <View style={styles.row}>
      {item.data.files.map((file) => {
        const pending = download.isPending && download.variables === file.path;
        return (
          <Pressable
            key={file.path}
            accessibilityRole="button"
            accessibilityLabel={`Download ${file.path}`}
            disabled={pending}
            onPress={() => download.mutate(file.path)}
            style={[styles.chip, pending ? { opacity: 0.5 } : null]}
          >
            <Icon name="Download" size={14} color={theme.colors.foregroundMuted} />
            <Text style={styles.label} numberOfLines={1}>
              {file.label}
            </Text>
            <Text style={styles.size}>{formatSize(file.size)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
