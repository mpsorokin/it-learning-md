# Portals and modal accessibility

## Interview questions

### Что такое Portal?
<!-- question-id: 15-react-portals-q01 -->
#### Ответ

`createPortal(children, domNode, key?)` — React DOM API, который размещает DOM-узлы переданного React-поддерева в другом DOM-контейнере. Контейнер должен уже существовать; смена целевого DOM node при обновлении пересоздаёт содержимое Portal. React-компоненты при этом остаются в прежнем месте React tree: state, context и reconciliation сохраняют исходную ancestry, а DOM получает другое физическое положение.

Это решает layout-задачи: dialog или tooltip может выйти из ancestor `overflow: hidden`, локального stacking context и clipping. Portal не создаёт новый React root, не снимает необходимость управлять focus/keyboard/semantics и сам по себе не гарантирует z-index или доступность. Его нужно применять к отдельной overlay-boundary, а не как общее средство позиционирования каждого popup. [Официальный `createPortal`](https://react.dev/reference/react-dom/createPortal).

### DOM tree vs React tree.
<!-- question-id: 15-react-portals-q02 -->
#### Ответ

DOM tree — фактически созданные браузерные узлы и их родители. React tree — логическая компонентная иерархия, где происходят state/context propagation и reconciliation. Без Portal эти структуры обычно похожи; Portal намеренно меняет только DOM placement. Компонент из Portal в `document.body` по-прежнему React-child исходного компонента, который создал Portal.

Из этого следуют различия: css inheritance, DOM query/focus order, clipping и обычные browser native events определяются физическим DOM; Context и React synthetic event bubbling следуют логике React tree. Для стилизации portal-content нужны явные CSS variables/classes на destination ancestry или свойства, переданные через Context/props; нельзя ожидать наследования стилей от React-предка, которого физически нет в DOM ancestry. [Поведение Portal по React и DOM](https://react.dev/reference/react-dom/createPortal).

### Как работает event propagation через Portal?
<!-- question-id: 15-react-portals-q03 -->
#### Ответ

React events, установленные через React props, распространяются по React tree, а не по новому DOM-пути. Поэтому click внутри Portal может вызвать `onClick` логического родителя, хотя этот parent не является его DOM ancestor. Это полезно для общего event model, но может сломать делегирование вроде `<AppShell onClick={closeMenu}>`: нажатие в modal может дойти до него.

Если событие не должно выйти из portal-subtree, обработайте его на соответствующем внутреннем элементе и вызовите `event.stopPropagation()` либо перестройте React tree так, чтобы Portal оказался за пределами логического обработчика. При диагностике отличайте React handler propagation от `addEventListener` на реальном DOM ancestor: нативное bubbling следует DOM-пути. Для outside click лучше проверять фактическую цель/границы overlay, а не полагаться только на всплытие к React parent. [React docs об event bubbling из Portal](https://react.dev/reference/react-dom/createPortal).

### Работает ли Context?
<!-- question-id: 15-react-portals-q04 -->
#### Ответ

Да. Portal не создаёт независимую React root, поэтому его children читают ближайший Provider выше Portal в React tree. Это сохраняет theme, locale, auth, modal manager и другие зависимости, хотя target DOM-node находится под `body` или иным контейнером.

Границы важны: sibling React root не наследует Context; соответствующие `Context` objects должны быть тем же объектом модуля; отдельный Provider выше Portal может переопределить значение. DOM-положение не меняет эти правила. [Документация Portal и Context](https://react.dev/reference/react-dom/createPortal), [поиск ближайшего Provider](https://react.dev/reference/react/useContext).

### Где использовать Portal?
<!-- question-id: 15-react-portals-q05 -->
#### Ответ

Используйте Portal, когда элемент визуально относится к компоненту/сценарию, но должен выйти из его DOM layout-boundary: modal, tooltip, date picker, contextual menu или notification layer, перекрывающий клиппинг, `overflow`, локальный transform/stacking context. Он полезен и при интеграции с non-React DOM-контейнером, например popup сторонней карты.

Portal не решает позиционирование якоря: dropdown всё ещё должен измерять trigger, учитывать scroll/resize/viewport и быть привязанным к anchor. Также он не подменяет менеджер нескольких overlays, z-index tokens, dismissal rules и focus management. Для SSR target должен быть доступен без обращения к `document` во время server render; часто используют заранее существующий root и создают Portal после client mount. При переходе между разными DOM targets React может пересоздать содержимое и потерять локальный state. [Сценарии и caveats `createPortal`](https://react.dev/reference/react-dom/createPortal).

### Modal / tooltip / dropdown.
<!-- question-id: 15-react-portals-q06 -->
#### Ответ

Это разные интерактивные паттерны, а не единый тип «overlay». Modal dialog временно блокирует взаимодействие с основным документом и переводит focus внутрь; пользователь закрывает его или завершает modal task. Tooltip — короткое неинтерактивное описание, связанное с элементом через `aria-describedby`; он не должен содержать controls, по которым нужно Tab-навигацией пройти. Dropdown может быть disclosure-панелью, menu, listbox или combobox — требуемые roles и keyboard model зависят от того, что он делает, а не от того, что он открыт поверх страницы.

Выбирайте WAI-ARIA pattern по поведению. Например, menu предполагает arrow-key navigation и menuitem semantics, а обычная фильтруемая listbox/combobox имеет другую модель. Не объявляйте произвольный div `role="menu"` ради вида. Portal влияет на DOM placement, но не добавляет ни role, ни focus behavior. Для всех вариантов проверьте keyboard-only путь, screen reader name/description, Escape/outside-dismissal, mobile touch, zoom и stacking с другими overlay. [WAI-ARIA Dialog Modal Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [React о доступности Portal](https://react.dev/reference/react-dom/createPortal).

### Accessibility modal.
<!-- question-id: 15-react-portals-q07 -->
#### Ответ

Доступный modal — это одновременно корректная семантика и реальное modal-поведение. Пользователь должен понять имя/назначение диалога; focus при открытии переносится на осмысленную точку внутри; Tab и Shift+Tab остаются в dialog; Escape закрывает его согласно продуктовой политике; при закрытии focus возвращается opener-у или логичному элементу, если opener исчез. Фон должен быть действительно недоступен для pointer и keyboard interaction, а не только приглушён визуально. Добавьте видимую кнопку закрытия, правильную heading hierarchy, удобный initial focus и тестируйте длинное содержимое/скролл.

Предпочитайте нативный `<dialog>.showModal()` там, где ваша browser support matrix это допускает: браузер помещает его в top layer и делает остальной документ inert, но автор всё равно задаёт accessible name, разумную точку focus, dismissal и визуальный стиль. Для custom `div role="dialog" aria-modal="true"` самим нужно полноценно реализовать focus trap/restore и inert background; ставить `aria-modal=true` без соответствующего поведения опасно для assistive technology.

WAI-ARIA APG предлагает `role="dialog"`, `aria-modal="true"` и accessible name через `aria-labelledby` либо `aria-label`; `aria-describedby` подходит для короткого простого описания, но не обязательно для сложной структуры. Проверьте Escape, Tab/Shift+Tab, close control, возврат focus и отсутствие доступа к фону с клавиатуры и screen reader. [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [HTML Standard о `showModal()` и inert background](https://html.spec.whatwg.org/multipage/interactive-elements.html#dom-dialog-showmodal), [заметка React о Portal accessibility](https://react.dev/reference/react-dom/createPortal).

### Реализовать production-like Modal через Portal.
<!-- question-id: 15-react-portals-task01 -->
#### Ответ

Так как в условии нет UI, поведения закрытия или browser support matrix, ниже — контролируемый modal для современных браузеров: Portal в `document.body` + нативный `dialog.showModal()`. HTML dialog даёт modal top layer и inert background, а React отвечает за state, name, close action и фокусируемый заголовок. Для старой browser matrix используйте проверенную dialog primitive/library или дополните реализацию полным focus trap/inert fallback.

```ts
import { createPortal } from "react-dom";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !portalRoot) return;

    if (open && !dialog.open) {
      dialog.showModal();
      titleRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open, portalRoot]);

  if (!portalRoot) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;

        // A pointer event on ::backdrop targets the dialog element too, so
        // distinguish the backdrop from empty space inside the dialog box.
        const rect = event.currentTarget.getBoundingClientRect();
        const clickedOutsideDialog =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;

        if (clickedOutsideDialog) onClose();
      }}
    >
      <h2 id={titleId} ref={titleRef} tabIndex={-1}>{title}</h2>
      <div>{children}</div>
      <button type="button" onClick={onClose}>Close</button>
    </dialog>,
    portalRoot,
  );
}
```

Родитель управляет `open` и сохраняет focus trigger до открытия; native dialog возвращает focus согласно dialog focusing algorithm при close. Именованный heading остаётся focusable для длинного/структурного содержимого. Для backdrop handler проверяет координаты за пределами прямоугольника dialog: у события на `::backdrop` target может быть самим dialog, но клик по пустому месту внутри его рамки не закрывает окно. Проверочные сценарии: открыть кнопкой и проверить начальный focus; Tab/Shift+Tab не уходят за modal; Escape вызывает `onClose`; клик внутри, включая пустую область у края, не закрывает; клик по backdrop закрывает; кнопка Close закрывает; после close focus возвращается на trigger; повторное открытие/закрытие и SSR первый render не обращаются к `document` до эффекта. Убедитесь в реальном браузере, а не только jsdom: тестовый DOM может не реализовать `showModal()`. Для nested dialogs, закрытия при роут-навигации, focus opener-а, который удалён, и legacy browsers добавьте dialog manager и явные fallback tests. [React `createPortal`](https://react.dev/reference/react-dom/createPortal), [HTML modal dialog algorithm](https://html.spec.whatwg.org/multipage/interactive-elements.html#dialog-light-dismiss), [WAI-ARIA keyboard/focus requirements](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
