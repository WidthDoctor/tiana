import type { MenuContentItem } from "../types";

export const appointmentContent: MenuContentItem = {
  id: "appointment",
  label: "Запись на прием",
  menuSection: "secondary",
  contentTitle: "Как проводится запись на сайте",
  contentText:
    `I. Вы выбираете удобное время в календаре, заполняете форму с контактными данными и отправляете заявку.

    II .Я получаю уведомление о новой записи и связываюсь с вами для подтверждения и уточнения деталей.

      Без подтверждения запись будет считаться недействительной.

    В день приема я буду ждать вас в студии, готовая помочь с выбором.
    `,
  imageSrc: "/images/homeSlider/toma(5).jpg",
};
