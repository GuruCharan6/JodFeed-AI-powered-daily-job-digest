import api from './axiosClient'

export const getProfile = () => api.get('/profile')

export const saveProfile = (data: object) => api.patch('/profile', data)

export const uploadResume = (file: File) => {
  const form = new FormData()
  form.append('resume', file)
  return api.post('/profile/resume', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}