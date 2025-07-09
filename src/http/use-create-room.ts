import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import type { CreateRoomsRequest } from './types/create-room-request'
import type { CreateRoomResponse } from './types/create-room-response'

const createRoomSchema = z.object({
  name: z.string().min(3, { message: 'Inclua no mínimo 3 caracteres' }),
  description: z.string(),
})

type CreateRoomFormData = z.infer<typeof createRoomSchema>

export function useCreateRoom() {
  const queryClient = useQueryClient()

  const { mutateAsync: createRoom } = useMutation({
    mutationFn: async (data: CreateRoomsRequest) => {
      const response = await fetch('http://localhost:3333/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result: CreateRoomResponse = await response.json()

      return result
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['get-rooms'],
      })
    },
  })

  const createRoomForm = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  async function handleCreateRoom({ name, description }: CreateRoomFormData) {
    await createRoom({ name, description })

    createRoomForm.reset()
  }

  return {
    createRoomForm,
    handleCreateRoom,
  }
}
