import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import type { CreateQuestionRequest } from './types/create-question-request'
import type { CreateQuestionResponse } from './types/create-question-response'

const createQuestionSchema = z.object({
  question: z
    .string()
    .min(1, 'Pergunta é obrigatória')
    .min(10, 'Pergunta deve ter pelo menos 10 caracteres')
    .max(500, 'Pergunta deve ter menos de 500 caracteres'),
})

type CreateQuestionFormData = z.infer<typeof createQuestionSchema>

export function useCreateQuestion(roomId: string) {
  const queryClient = useQueryClient()

  const { mutateAsync: createQuestion } = useMutation({
    mutationFn: async (data: CreateQuestionRequest) => {
      const response = await fetch(
        `http://localhost:3333/rooms/${roomId}/questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      const result: CreateQuestionResponse = await response.json()

      return result
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['get-questions', roomId],
      })
    },
  })

  const form = useForm<CreateQuestionFormData>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      question: '',
    },
  })

  async function handleCreateQuestion(data: CreateQuestionFormData) {
    await createQuestion(data)
  }

  return {
    form,
    handleCreateQuestion,
  }
}
