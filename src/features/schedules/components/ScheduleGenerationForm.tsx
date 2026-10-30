import {
  CalendarDays,
  Shuffle,
  Sparkles,
  Info,
  LockKeyhole,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FieldHelp } from "@/components/shared/FieldHelp";

import type { DistributionMode } from "../types/schedule.types";

export interface GenerationSettings {
  year: number;
  month: number;
  mode: DistributionMode;
  defaultMaxActivitiesPerMeeting: number;
  preserveLockedAssignments: boolean;
}

interface ScheduleGenerationFormProps {
  value: GenerationSettings;
  onChange: (value: GenerationSettings) => void;
  onGenerate: () => void;
  loading?: boolean;
}

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

interface DistributionOptionProps {
  title: string;
  description: string;
  help: string;
  icon: React.ElementType;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}

function DistributionOption({
  title,
  description,
  help,
  icon: Icon,
  selected,
  disabled,
  onSelect,
}: DistributionOptionProps) {
  return (
    <div
      className={`
        relative flex flex-col rounded-2xl border
        transition-all duration-200
        ${
          selected
            ? "border-lar-green bg-accent"
            : "border-border bg-background hover:border-lar-green/50"
        }
        ${disabled ? "opacity-60" : ""}
      `}
    >
      {/* Botão principal de seleção */}
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Selecionar distribuição ${title.toLowerCase()}`}
        className="
          flex w-full flex-1 flex-col items-start
          rounded-2xl p-4 pr-12 text-left
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-ring
          disabled:cursor-not-allowed
        "
      >
        <div className="mb-3 flex w-full items-center justify-between">
          <Icon
            className={`size-5 ${
              selected ? "text-lar-dark-green" : "text-muted-foreground"
            }`}
          />

          <div
            aria-hidden="true"
            className={`
              flex size-5 items-center justify-center
              rounded-full border-2 transition-colors
              ${
                selected
                  ? "border-lar-green bg-lar-green"
                  : "border-muted-foreground/40"
              }
            `}
          >
            {selected && <div className="size-2 rounded-full bg-white" />}
          </div>
        </div>

        <span className="font-semibold">{title}</span>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </button>

      {/* Tooltip fora do botão principal */}
      <div className="absolute right-3 top-12 z-10">
        <FieldHelp label={`Distribuição ${title}`} content={help} />
      </div>
    </div>
  );
}

export function ScheduleGenerationForm({
  value,
  onChange,
  onGenerate,
  loading = false,
}: ScheduleGenerationFormProps) {
  function update(changes: Partial<GenerationSettings>) {
    onChange({
      ...value,
      ...changes,
    });
  }

  const isValidYear =
    Number.isInteger(value.year) && value.year >= 2000 && value.year <= 2100;

  const isValidMonth =
    Number.isInteger(value.month) && value.month >= 1 && value.month <= 12;

  const isValidLimit =
    Number.isInteger(value.defaultMaxActivitiesPerMeeting) &&
    value.defaultMaxActivitiesPerMeeting >= 1 &&
    value.defaultMaxActivitiesPerMeeting <= 20;

  const canGenerate = !loading && isValidYear && isValidMonth && isValidLimit;

  return (
    <section className="space-y-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent">
          <CalendarDays className="size-5 text-accent-foreground" />
        </div>

        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold">
            Configurar geração
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Escolha quando os encontros acontecerão e como os participantes
            serão distribuídos.
          </p>
        </div>
      </div>

      {/* Período e limites */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Mês */}
        <div className="space-y-2">
          <div className="flex min-h-7 items-center gap-1">
            <Label htmlFor="schedule-month">Mês da escala</Label>

            <FieldHelp
              label="Mês da escala"
              content="Selecione o mês para o qual deseja organizar os encontros. O LAR identificará automaticamente todas as quintas-feiras desse período."
            />
          </div>

          <select
            id="schedule-month"
            value={value.month}
            disabled={loading}
            onChange={(event) =>
              update({
                month: Number(event.target.value),
              })
            }
            className="
              h-12 w-full rounded-xl border border-input
              bg-background px-3 text-sm
              transition-colors
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-ring
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>

          <p className="text-xs text-muted-foreground">
            Todos os encontros de quinta-feira.
          </p>
        </div>

        {/* Ano */}
        <div className="space-y-2">
          <div className="flex min-h-7 items-center gap-1">
            <Label htmlFor="schedule-year">Ano</Label>

            <FieldHelp
              label="Ano"
              content="Informe o ano da programação. Junto com o mês selecionado, ele será utilizado para identificar as datas dos encontros."
            />
          </div>

          <Input
            id="schedule-year"
            type="number"
            min={2000}
            max={2100}
            value={value.year}
            disabled={loading}
            aria-invalid={!isValidYear}
            onChange={(event) =>
              update({
                year: Number(event.target.value),
              })
            }
            className="h-12"
          />

          <p
            className={`text-xs ${
              isValidYear ? "text-muted-foreground" : "text-destructive"
            }`}
          >
            {isValidYear
              ? "Ano em que os encontros acontecerão."
              : "Informe um ano entre 2000 e 2100."}
          </p>
        </div>

        {/* Limite de atividades */}
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <div className="flex min-h-7 items-center gap-1">
            <Label htmlFor="schedule-limit" className="leading-tight">
              Máximo de atividades por pessoa
            </Label>

            <FieldHelp
              label="Máximo de atividades por pessoa"
              content="Define quantas atividades uma pessoa pode assumir na mesma quinta-feira. Exemplo: com limite 2, João pode ficar responsável pelo louvor e pela oferta, mas não por uma terceira atividade. Se João tiver um limite individual no cadastro, esse limite terá prioridade."
            />
          </div>

          <Input
            id="schedule-limit"
            type="number"
            min={1}
            max={20}
            value={value.defaultMaxActivitiesPerMeeting}
            disabled={loading}
            aria-invalid={!isValidLimit}
            onChange={(event) =>
              update({
                defaultMaxActivitiesPerMeeting: Number(event.target.value),
              })
            }
            className="h-12"
          />

          <p
            className={`text-xs leading-relaxed ${
              isValidLimit ? "text-muted-foreground" : "text-destructive"
            }`}
          >
            {isValidLimit
              ? "Vale para cada quinta-feira, não para o mês inteiro."
              : "Informe um limite entre 1 e 20 atividades."}
          </p>
        </div>
      </div>

      {/* Estratégia de distribuição */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Label>Como distribuir os participantes?</Label>

            <FieldHelp
              label="Estratégia de distribuição"
              content="Escolha como o LAR selecionará os responsáveis pelas atividades. A distribuição equilibrada considera o histórico de participações. A aleatória realiza sorteios. Ambas respeitam as restrições cadastradas."
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Escolha uma das opções abaixo.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DistributionOption
            title="Equilibrada"
            description="Prioriza quem participou menos, considerando as escalas anteriores."
            help="O LAR analisa o histórico de participações e procura distribuir as responsabilidades de maneira justa. Também considera quantas atividades cada pessoa já recebeu, quais atividades pode realizar e sua disponibilidade."
            icon={Sparkles}
            selected={value.mode === "BALANCED"}
            disabled={loading}
            onSelect={() => update({ mode: "BALANCED" })}
          />

          <DistributionOption
            title="Aleatória"
            description="Sorteia os responsáveis sem considerar quem participou mais."
            help="O LAR sorteia os responsáveis entre as pessoas disponíveis e autorizadas para cada atividade. Mesmo sendo aleatória, a distribuição respeita os limites individuais e procura preencher todas as vagas possíveis."
            icon={Shuffle}
            selected={value.mode === "RANDOM"}
            disabled={loading}
            onSelect={() => update({ mode: "RANDOM" })}
          />
        </div>
      </div>

      {/* Preservar responsáveis fixados */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/60 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-background sm:flex">
            <LockKeyhole className="size-4 text-muted-foreground" />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1">
              <Label htmlFor="preserve-locked" className="leading-tight">
                Manter responsáveis fixados
              </Label>

              <FieldHelp
                label="Manter responsáveis fixados"
                content="Preserva os responsáveis que foram fixados manualmente nas escalas já salvas do mês. Ao gerar novamente, essas escolhas continuam iguais e as demais vagas podem ser redistribuídas. Desative esta opção se desejar refazer também as atribuições fixadas."
              />
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Ao gerar novamente, mantém as pessoas que você fixou manualmente
              nas atividades.
            </p>
          </div>
        </div>

        <Switch
          id="preserve-locked"
          checked={value.preserveLockedAssignments}
          disabled={loading}
          onCheckedChange={(checked) =>
            update({
              preserveLockedAssignments: checked,
            })
          }
          className="shrink-0"
        />
      </div>

      {/* Explicação da geração */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

        <div className="space-y-2">
          <p className="text-sm font-semibold">Como funciona a geração?</p>

          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            O LAR encontrará todas as quintas-feiras do mês e distribuirá os
            participantes entre as atividades, respeitando suas
            disponibilidades, permissões e limites individuais.
          </p>

          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Você poderá conferir o resultado antes de salvar. Caso alguma
            atividade fique sem responsável, o sistema mostrará uma pendência.
          </p>
        </div>
      </div>

      {/* Ação principal */}
      <div className="space-y-2">
        <Button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="h-12 w-full rounded-full font-semibold"
        >
          <Sparkles className="size-4" />

          {loading ? "Preparando escala..." : "Gerar escala mensal"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          A escala só será salva após sua confirmação.
        </p>
      </div>
    </section>
  );
}
