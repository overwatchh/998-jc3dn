import apiClient from "@/lib/api/apiClient";
import { GenerateQrRequestBody, GenerateQrResponse } from "@/types/qr-code";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const QR_CODE_GENERATION_QUERY_KEY = ["qrCodeGeneration"];

// Get QR code
export const useGenerateQr = (id: number) => {
  const queryClient = useQueryClient();
  const mutationFn = async (args: GenerateQrRequestBody) => {
    const { data } = await apiClient.post<GenerateQrResponse>(
      `/lecturer/session/${id}/generate-qr`,
      args
    );
    return data;
  };
  return useMutation({
    mutationKey: [QR_CODE_GENERATION_QUERY_KEY, id],
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QR_CODE_GENERATION_QUERY_KEY],
      });
    },
  });
};
