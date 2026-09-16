export const OPENING_SCENE_DURATION_MS = 5_200;

export const openingScenes = [
  {
    eyebrow: 'PROLOGUE I',
    title: '대륙 최후의 밤',
    text: '마왕군의 검은 깃발이 왕도 위에 올랐다. 배신한 인간 군세와 괴물, 악마가 합류하며 왕국의 영토는 마지막 성채 하나만 남았다.',
    art: 'fallen-kingdom',
    image: '/assets/opening/opening-01-fallen-continent.webp',
    imagePosition: 'center center',
  },
  {
    eyebrow: 'PROLOGUE II',
    title: '꺼지지 않은 불씨',
    text: '무너진 마을의 생존자와 흩어진 병사들이 최후의 성채로 모여들었다. 가진 것은 낡은 무기와 단 한 명의 민병대뿐이었다.',
    art: 'last-bastion',
    image: '/assets/opening/opening-02-last-bastion.webp',
    imagePosition: 'center center',
  },
  {
    eyebrow: 'PROLOGUE III',
    title: '반격의 맹세',
    text: '성벽 위에 왕국의 깃발이 다시 올랐다. 되찾은 전리품으로 병사를 단련하고, 적의 병종마저 영입하며 빼앗긴 대륙을 한 걸음씩 되찾아야 한다.',
    art: 'oath',
    image: '/assets/opening/opening-03-oath.webp',
    imagePosition: 'center center',
  },
  {
    eyebrow: 'THE COUNTEROFFENSIVE',
    title: '최후의 성채에서 진군하라',
    text: '서부 변경에서 마왕성의 심장부까지. 오늘, 멸망 직전의 왕국이 반격을 시작한다.',
    art: 'counteroffensive',
    image: '/assets/opening/opening-04-counteroffensive.webp',
    imagePosition: 'center center',
  },
] as const;
