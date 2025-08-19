import apiClient from "@/lib/api/apiClient";
import { GenerateQrRequestBody } from "@/types/qr-code";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const QR_CODE_GENERATION_QUERY_KEY = ["qrCodeGeneration"];

// Get QR code
export const useGenerateQr = () => {
  const queryClient = useQueryClient();
  const mutationFn = async (args: {
    id: number;
    reqBody: GenerateQrRequestBody;
  }) => {
    const { data } = await apiClient.post(
      `/lecturer/session/${args.id}/generate-qr`,
      args.reqBody
    );
    return data;
  };
  return useMutation({
    mutationKey: [QR_CODE_GENERATION_QUERY_KEY],
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QR_CODE_GENERATION_QUERY_KEY],
      });
    },
  });
};
