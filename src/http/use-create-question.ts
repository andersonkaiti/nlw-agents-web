import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import type { CreateQuestionRequest } from './types/create-question-request'
import type { CreateQuestionResponse } from './types/create-question-response'
import type { GetRoomQuestionsResponse } from './types/get-room-questions-response'

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

  const queryKey = ['get-questions', roomId]

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

    // Execute no momento que for feita a chamada p/ API
    onMutate({ question }) {
      const questions =
        queryClient.getQueryData<GetRoomQuestionsResponse>(queryKey)

      const newQuestion: GetRoomQuestionsResponse[0] = {
        id: crypto.randomUUID(),
        question,
        answer: null,
        createdAt: new Date().toISOString(),
        isGeneratingAnswer: true,
      }

      queryClient.setQueryData<GetRoomQuestionsResponse>(queryKey, [
        newQuestion,
        ...(questions ?? []),
      ])

      return { newQuestion, questions }
    },

    onSuccess(data, _variables, context) {
      if (context?.questions) {
        queryClient.setQueryData<GetRoomQuestionsResponse>(
          queryKey,
          (questions) =>
            questions?.map((question) => {
              if (question.id === context.newQuestion.id) {
                return {
                  ...context.newQuestion,
                  id: data.questionId,
                  answer: data.answer,
                  isGeneratingAnswer: false,
                }
              }

              return question
            }) || questions
        )
      }
    },

    onError(_error, _variables, context) {
      if (context?.questions) {
        queryClient.setQueryData<GetRoomQuestionsResponse>(queryKey, [
          ...(context.questions ?? []),
        ])
      }
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
