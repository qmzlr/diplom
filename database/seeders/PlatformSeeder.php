<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Instrument;
use App\Models\Lesson;
use App\Models\PlatformComment;
use App\Models\UserVideo;
use Illuminate\Database\Seeder;

class PlatformSeeder extends Seeder
{
    public function run(): void
    {
        $lessonVideos = ['/videos/spatial.mp4', '/videos/capabilities-music.mp4', '/videos/sea-hotel.mp4'];

        $instruments = [
            ['slug' => 'guitar', 'name' => 'Гитара', 'image' => '/images/course-guitar.jpg', 'description' => 'Акустика, аккорды, ритм и песни для самостоятельной практики.', 'course_count' => 1],
            ['slug' => 'piano', 'name' => 'Фортепиано', 'image' => '/images/course-piano.jpg', 'description' => 'Клавиши, координация рук, слух и музыкальная теория.', 'course_count' => 1],
            ['slug' => 'drums', 'name' => 'Ударные', 'image' => '/images/course-drums.jpg', 'description' => 'Ритм, координация, grooves и тренировка с метрономом.', 'course_count' => 1],
            ['slug' => 'vocal', 'name' => 'Вокал', 'image' => '/images/course-vocal.jpg', 'description' => 'Дыхание, диапазон, интонация и запись домашней практики.', 'course_count' => 1],
            ['slug' => 'ukulele', 'name' => 'Укулеле', 'image' => '/images/course-ukulele.jpg', 'description' => 'Лёгкий старт, аккорды, переборы и быстрый репертуар.', 'course_count' => 1],
            ['slug' => 'theory', 'name' => 'Теория', 'image' => '/images/course-theory.jpg', 'description' => 'Ноты, гармония, интервалы и понимание структуры музыки.', 'course_count' => 1],
        ];

        foreach ($instruments as $instrument) {
            Instrument::query()->updateOrCreate(
                ['slug' => $instrument['slug']],
                $instrument,
            );
        }

        $courses = [
            [
                'code' => '01',
                'title' => 'Основы гитары',
                'author' => 'Антон Лебедев',
                'category' => 'Основы',
                'instrument' => 'Гитара',
                'image' => '/images/course-guitar.jpg',
                'tagline' => 'Освойте акустическую гитару с нуля — от первых аккордов до уверенного перебора.',
                'short_description' => 'Первые аккорды, посадка, бой, перебор и уверенный старт на акустике.',
                'description' => [
                    'Курс построен вокруг ежедневной практики: короткие видеоуроки, упражнения на технику и разбор популярных песен.',
                    'К концу программы вы будете уверенно перебирать, играть боем и сопровождать любимые треки.',
                ],
                'features' => ['40 видеоуроков общей продолжительностью 8 часов', 'Интерактивные табулатуры', 'Упражнения с метрономом', 'Разбор 15 популярных песен'],
                'outcomes' => ['Настраивать инструмент', 'Играть базовые аккорды', 'Держать ритм под метроном', 'Разбирать песни самостоятельно'],
                'lessons' => '40 уроков',
                'lesson_count' => 40,
                'level' => 'Начинающий',
                'duration' => '8 недель',
                'duration_weeks' => 8,
                'progress' => 42,
                'video' => $lessonVideos[0],
                'lesson_titles' => ['Посадка и настройка', 'Первые аккорды', 'Ритмический бой', 'Перебор и динамика', 'Разбор первой песни'],
            ],
            [
                'code' => '02',
                'title' => 'Старт на фортепиано',
                'author' => 'Мария Соколова',
                'category' => 'Основы',
                'instrument' => 'Фортепиано',
                'image' => '/images/course-piano.jpg',
                'tagline' => 'Начните играть на пианино с правильной техникой и музыкальным слухом.',
                'short_description' => 'Клавиши, слух, координация рук и первые мелодии с аккомпанементом.',
                'description' => ['Этот курс раскрывает фортепиано как инструмент для самовыражения.', 'Программа включает нотную грамоту, ритмику и интервалы через практику.'],
                'features' => ['36 видеоуроков с несколькими ракурсами', 'Виртуальная клавиатура', 'Упражнения на независимость рук', 'PDF-конспекты'],
                'outcomes' => ['Читать простую партию', 'Играть двумя руками', 'Понимать интервалы', 'Разбирать мелодии'],
                'lessons' => '36 уроков',
                'lesson_count' => 36,
                'level' => 'Начинающий',
                'duration' => '10 недель',
                'duration_weeks' => 10,
                'progress' => 28,
                'video' => $lessonVideos[1],
                'lesson_titles' => ['Посадка за инструментом', 'Первые клавиши', 'Ритм двумя руками', 'Простая гармония', 'Мини-репертуар'],
            ],
            [
                'code' => '03',
                'title' => 'Практика на ударных',
                'author' => 'Денис Орлов',
                'category' => 'Ритм',
                'instrument' => 'Ударные',
                'image' => '/images/course-drums.jpg',
                'tagline' => 'Почувствуйте ритм изнутри — от первого бита до уверенных grooves.',
                'short_description' => 'Координация, базовые рисунки, fills и практика с метрономом.',
                'description' => ['Курс для тех, кто хочет освоить барабаны и развить внутренний ритм.', 'Особое внимание уделено работе с метрономом, динамике и заполнениям.'],
                'features' => ['32 видеоурока', 'Встроенный метроном', 'Библиотека минусовок', 'Разбор grooves'],
                'outcomes' => ['Держать ровный groove', 'Играть fills', 'Тренироваться с кликом', 'Собирать партии под минус'],
                'lessons' => '32 урока',
                'lesson_count' => 32,
                'level' => 'Начинающий',
                'duration' => '8 недель',
                'duration_weeks' => 8,
                'progress' => 64,
                'video' => $lessonVideos[2],
                'lesson_titles' => ['Работа рук', 'Первый beat', 'Ноги и координация', 'Fills', 'Игра под минус'],
            ],
            [
                'code' => '04',
                'title' => 'Тренировка вокала',
                'author' => 'Елена Миронова',
                'category' => 'Техника',
                'instrument' => 'Вокал',
                'image' => '/images/course-vocal.jpg',
                'tagline' => 'Откройте свой голос — дыхание, техника, уверенность на сцене.',
                'short_description' => 'Дыхание, резонаторы, диапазон и уверенное исполнение песен.',
                'description' => ['Комплексный вокальный курс для начинающих певцов.', 'Каждый модуль завершается записью вокальной партии с персональной обратной связью.'],
                'features' => ['44 видеоурока', 'Ежедневные вокальные разминки', 'Упражнения на диапазон', 'Запись вокала'],
                'outcomes' => ['Дышать диафрагмой', 'Петь чище', 'Расширять диапазон', 'Записывать домашние задания'],
                'lessons' => '44 урока',
                'lesson_count' => 44,
                'level' => 'Начинающий',
                'duration' => '10 недель',
                'duration_weeks' => 10,
                'progress' => 18,
                'video' => $lessonVideos[0],
                'lesson_titles' => ['Дыхание', 'Разминка', 'Резонаторы', 'Чистая интонация', 'Запись голоса'],
            ],
            [
                'code' => '05',
                'title' => 'Курс укулеле',
                'author' => 'Кира Волкова',
                'category' => 'Песни',
                'instrument' => 'Укулеле',
                'image' => '/images/course-ukulele.jpg',
                'tagline' => 'Лёгкий и радостный старт — укулеле для начинающих.',
                'short_description' => 'Компактные уроки, аккорды, переборы и первые песни за несколько занятий.',
                'description' => ['Укулеле — идеальный инструмент для быстрого старта в музыке.', 'Программа включает fingerstyle, боевые техники, переборы и простые соло.'],
                'features' => ['28 коротких видеоуроков', 'Каталог аккордов', 'Разбор песен', 'Трекер ежедневной практики'],
                'outcomes' => ['Играть простые песни', 'Зажимать аккорды', 'Использовать перебор', 'Практиковаться короткими сессиями'],
                'lessons' => '28 уроков',
                'lesson_count' => 28,
                'level' => 'Начинающий',
                'duration' => '6 недель',
                'duration_weeks' => 6,
                'progress' => 76,
                'video' => $lessonVideos[1],
                'lesson_titles' => ['Строй укулеле', 'Аккорды C F G', 'Первый бой', 'Fingerstyle', 'Песня целиком'],
            ],
            [
                'code' => '06',
                'title' => 'Музыкальная теория',
                'author' => 'Илья Ветров',
                'category' => 'Теория',
                'instrument' => 'Любой инструмент',
                'image' => '/images/course-theory.jpg',
                'tagline' => 'Поймите музыку изнутри — ноты, гармония, структура композиций.',
                'short_description' => 'Ноты, интервалы, аккорды, тональности и теория через практические примеры.',
                'description' => ['Теория музыки становится понятной, когда изучается через практику.', 'Вы научитесь читать ноты, строить аккордовые последовательности и понимать лад.'],
                'features' => ['30 видеоуроков', 'Визуализация интервалов', 'Тренажёр чтения нот', 'PDF-справочники'],
                'outcomes' => ['Читать ноты', 'Строить аккорды', 'Понимать тональности', 'Анализировать песни'],
                'lessons' => '30 уроков',
                'lesson_count' => 30,
                'level' => 'Базовый',
                'duration' => '8 недель',
                'duration_weeks' => 8,
                'progress' => 35,
                'video' => $lessonVideos[2],
                'lesson_titles' => ['Нотный стан', 'Интервалы', 'Аккорды', 'Тональности', 'Гармония песни'],
            ],
        ];

        foreach ($courses as $courseData) {
            $lessonTitles = $courseData['lesson_titles'];
            unset($courseData['lesson_titles']);

            $course = Course::query()->updateOrCreate(
                ['code' => $courseData['code']],
                $courseData,
            );

            $course->lessonList()->delete();

            foreach ($lessonTitles as $index => $title) {
                Lesson::query()->create([
                    'course_id' => $course->id,
                    'code' => 'course-'.$course->code.'-'.($index + 1),
                    'title' => $title,
                    'description' => 'Короткий практический урок с демонстрацией, заданием для самостоятельной работы и проверкой ритма.',
                    'duration' => (10 + $index * 3).' мин',
                    'video' => $lessonVideos[$index % count($lessonVideos)],
                    'completed' => $index < 2,
                    'position' => $index + 1,
                ]);
            }
        }

        $videos = [
            ['title' => 'Перебор на гитаре', 'description' => 'Домашняя практика к уроку 04.', 'instrument' => 'Гитара', 'status' => 'опубликовано', 'image' => '/images/course-guitar.jpg'],
            ['title' => 'Аккорды без пауз', 'description' => 'Плавные переходы между C, G и Am.', 'instrument' => 'Гитара', 'status' => 'опубликовано', 'image' => '/images/course-guitar.jpg'],
            ['title' => 'Ритмический бой', 'description' => 'Пробую держать ровную восьмую.', 'instrument' => 'Гитара', 'status' => 'опубликовано', 'image' => '/images/course-guitar.jpg'],
            ['title' => 'Пиано: две руки', 'description' => 'Запись упражнения на координацию.', 'instrument' => 'Фортепиано', 'status' => 'опубликовано', 'image' => '/images/course-piano.jpg'],
            ['title' => 'Левая рука отдельно', 'description' => 'Медленная тренировка басовой партии.', 'instrument' => 'Фортепиано', 'status' => 'опубликовано', 'image' => '/images/course-piano.jpg'],
            ['title' => 'Мини-этюд', 'description' => 'Короткая пьеса с динамикой.', 'instrument' => 'Фортепиано', 'status' => 'опубликовано', 'image' => '/images/course-piano.jpg'],
            ['title' => 'Первый groove', 'description' => 'Базовый рисунок с метрономом.', 'instrument' => 'Ударные', 'status' => 'опубликовано', 'image' => '/images/course-drums.jpg'],
            ['title' => 'Fill на четыре доли', 'description' => 'Отрабатываю переход в припев.', 'instrument' => 'Ударные', 'status' => 'опубликовано', 'image' => '/images/course-drums.jpg'],
            ['title' => 'Практика хай-хэта', 'description' => 'Акцент на слабые доли.', 'instrument' => 'Ударные', 'status' => 'опубликовано', 'image' => '/images/course-drums.jpg'],
            ['title' => 'Вокальная разминка', 'description' => 'Проверка дыхания и интонации.', 'instrument' => 'Вокал', 'status' => 'опубликовано', 'image' => '/images/course-vocal.jpg'],
            ['title' => 'Чистая интонация', 'description' => 'Работаю над устойчивыми нотами.', 'instrument' => 'Вокал', 'status' => 'опубликовано', 'image' => '/images/course-vocal.jpg'],
            ['title' => 'Дыхание перед фразой', 'description' => 'Короткое упражнение на опору.', 'instrument' => 'Вокал', 'status' => 'опубликовано', 'image' => '/images/course-vocal.jpg'],
            ['title' => 'Укулеле: первый бой', 'description' => 'Простая песня в медленном темпе.', 'instrument' => 'Укулеле', 'status' => 'опубликовано', 'image' => '/images/course-ukulele.jpg'],
            ['title' => 'Перебор на укулеле', 'description' => 'Практика правой руки.', 'instrument' => 'Укулеле', 'status' => 'опубликовано', 'image' => '/images/course-ukulele.jpg'],
            ['title' => 'Аккорды C F G', 'description' => 'Переходы без остановки.', 'instrument' => 'Укулеле', 'status' => 'опубликовано', 'image' => '/images/course-ukulele.jpg'],
            ['title' => 'Интервалы на слух', 'description' => 'Проверяю распознавание терций.', 'instrument' => 'Теория', 'status' => 'опубликовано', 'image' => '/images/course-theory.jpg'],
            ['title' => 'Разбор тональности', 'description' => 'Нахожу устойчивые ступени.', 'instrument' => 'Теория', 'status' => 'опубликовано', 'image' => '/images/course-theory.jpg'],
            ['title' => 'Аккордовая цепочка', 'description' => 'Собираю простую гармонию.', 'instrument' => 'Теория', 'status' => 'опубликовано', 'image' => '/images/course-theory.jpg'],
            ['title' => 'Пиано: новая практика', 'description' => 'Свежая запись ученика.', 'instrument' => 'Фортепиано', 'status' => 'опубликовано', 'image' => '/images/course-piano.jpg'],
            ['title' => 'Вокал: работа над фразой', 'description' => 'Повтор сложного фрагмента.', 'instrument' => 'Вокал', 'status' => 'опубликовано', 'image' => '/images/course-vocal.jpg'],
        ];

        foreach ($videos as $video) {
            UserVideo::query()->updateOrCreate(
                ['title' => $video['title']],
                $video,
            );
        }

        $comments = [
            ['author' => 'Мария', 'text' => 'Очень помогло упражнение с метрономом.', 'target' => 'Практика на ударных', 'target_type' => 'course', 'target_code' => '03', 'status' => 'ожидает'],
            ['author' => 'Илья', 'text' => 'Добавил бы больше разборов песен.', 'target' => 'Основы гитары', 'target_type' => 'course', 'target_code' => '01', 'status' => 'одобрено'],
            ['author' => 'Аня', 'text' => 'Не поняла задание к третьему уроку.', 'target' => 'Старт на фортепиано', 'target_type' => 'course', 'target_code' => '02', 'status' => 'ожидает'],
        ];

        foreach ($comments as $comment) {
            PlatformComment::query()->updateOrCreate(
                ['author' => $comment['author'], 'target' => $comment['target']],
                $comment,
            );
        }
    }
}
