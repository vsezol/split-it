import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { Component, computed, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { TuiCurrencyPipe } from '@taiga-ui/addon-commerce';
import { TUI_DEFAULT_MATCHER, TuiLet, TuiStringHandler } from '@taiga-ui/cdk';
import { TuiButton, TuiError, TuiIcon, TuiRoot } from '@taiga-ui/core';
import { TuiFieldErrorPipe, tuiValidationErrorsProvider } from '@taiga-ui/kit';
import {
  TuiInputModule,
  TuiInputNumberModule,
  TuiIslandDirective,
  TuiMultiSelectModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { nanoid } from 'nanoid';
import { filter, of } from 'rxjs';
import { Person, calculateTransfers } from './shared/lib/get-result';
import { withPreferredTheme } from './shared/lib/with-preferred-theme';

const DEFAULT_PARTICIPANTS: string[] = [
  'Волян',
  'Костян А',
  'Костян П',
  'Леха',
  'Миктор',
  'Петя',
  'Кирюха',
];

interface Participant {
  id: string;
  name: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    TuiRoot,
    ReactiveFormsModule,
    TuiInputModule,
    TuiIcon,
    TuiMultiSelectModule,
    TuiFieldErrorPipe,
    TuiError,
    AsyncPipe,
    TuiButton,
    TuiLet,
    KeyValuePipe,
    TuiTextfieldControllerModule,
    TuiCurrencyPipe,
    TuiInputNumberModule,
    TuiIslandDirective,
  ],
  providers: [
    tuiValidationErrorsProvider({
      required: 'Заполни это!',
      minlength: ({ requiredLength }: { requiredLength: string }) =>
        of(`Минимальный размер — ${requiredLength}`),
    }),
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
})
export class AppComponent {
  readonly items: Participant[] = [];

  readonly transfers = signal<[string, string, number][]>([]);

  protected readonly theme = withPreferredTheme();

  protected readonly form = new FormGroup({
    name: new FormControl<string>('', Validators.required),
    participants: new FormControl<Participant[]>([], [Validators.required]),
    amounts: new FormGroup<Record<string, FormControl<number | null>>>({}),
  });

  protected participantsSearch = model<string>('');
  protected readonly participantsStringify: TuiStringHandler<Participant> = (
    item
  ) => item.name;

  protected foundParticipants = computed(() =>
    this.items.filter((item) =>
      TUI_DEFAULT_MATCHER(item.name, this.participantsSearch() || '')
    )
  );

  protected getAmountsControls(): [string, FormControl<number | null>][] {
    return Object.entries(this.form.controls.amounts.controls).map(
      ([id, control]) => {
        return [this.items.find((x) => x.id === id)?.name ?? '', control];
      }
    );
  }

  constructor() {
    DEFAULT_PARTICIPANTS.forEach((name) =>
      this.items.push({ id: nanoid(), name })
    );

    this.form.controls.participants.valueChanges
      .pipe(takeUntilDestroyed(), filter(Boolean))
      .subscribe((value) => {
        const amountsForm = this.form.controls.amounts;
        const notExistKeys = value
          .map(({ id }) => id)
          .filter((id) => !(id in amountsForm.controls));

        notExistKeys.forEach((id) => {
          amountsForm.addControl(id, new FormControl(0));
        });
      });

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const persons: Person[] = this.getAmountsControls().map(
        ([name, control]) => ({ name, paid: control.value ?? 0 })
      );

      this.transfers.set(
        calculateTransfers(persons).map(({ from, to, amount }) => [
          from,
          to,
          amount,
        ])
      );
    });
  }

  handleAddParticipant(): void {
    const search = this.participantsSearch().trim();
    if (search.length === 0) {
      return;
    }

    const newParticipant = { id: nanoid(), name: search };

    this.items.push(newParticipant);
    this.form.controls.participants.setValue([
      ...(this.form.controls.participants.value ?? []),
      newParticipant,
    ]);
    this.participantsSearch.set('');
  }
}
