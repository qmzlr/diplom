export interface Lesson {
  id: string
  databaseId: number
  title: string
  description: string
  duration: string
  video: string
  completed?: boolean
}

export interface Course {
  id: string
  status?: 'черновик' | 'на модерации' | 'опубликовано' | 'отклонено'
  owner?: { id: string; name: string | null; email: string | null } | null
  title: string
  author: string
  category: string
  instrument: string
  img: string
  tagline: string
  shortDescription: string
  description: string[]
  features: string[]
  outcomes: string[]
  lessons: string
  lessonCount: number
  level: string
  progress: number
  video: string
  lessonList: Lesson[]
  reason?: string
}

export interface CompletedLesson {
  id: string
  databaseId: number | null
  title: string
  courseId: string | null
  courseTitle: string
  lessonId: string | null
  completedAt: string | null
}

export interface Instrument {
  id: string
  name: string
  image: string
  description: string
  courseCount: number
}

export interface UserVideo {
  id: string
  title: string
  description: string
  author: string
  authorAvatar?: string | null
  instrument: string
  status: 'опубликовано' | 'на модерации' | 'отклонено'
  image: string
  video?: string | null
  detailUrl?: string
}

export interface CommentItem {
  id: string
  author: string
  text: string
  target: string
  targetType: 'course' | 'lesson' | 'video' | 'platform'
  targetCode: string | null
  targetUrl?: string | null
  status: 'ожидает' | 'одобрено' | 'отклонено'
}

export interface AdminUser {
  id: string
  name: string | null
  email: string | null
  avatar: string | null
  role: 'user' | 'admin' | 'moderator' | 'teacher'
  teacherStatus?: 'ожидает' | 'одобрен' | 'отклонён' | null
  instrument: string | null
  level: string | null
  instrumentIds: string[]
  createdAt?: string | null
  lastSignInAt?: string | null
}

export interface TeacherApplication {
  id: string
  name: string | null
  email: string | null
  status: 'ожидает' | 'одобрен' | 'отклонён'
  instrument: string | null
  instrumentIds: string[]
  instruments: string[]
}
