import React from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const NAME_MAX = 100;
const PHRASE_MAX = 500;

const Counter = ({ value, max }) => (
  <span className={`text-xs ${value.length >= max ? 'text-amber-400' : 'text-white/40'}`}>{value.length}/{max}</span>
);

function daysTogether(value) {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return differenceInCalendarDays(new Date(), date);
}

export default function BasicInfoCard({ values, onChange }) {
  const days = daysTogether(values.relationship_start);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-[#FF6B6B]" />
          Informações básicas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="flex items-end justify-between">
            <Label htmlFor="couple-name" className="text-white">Nome do casal</Label>
            <Counter value={values.couple_name} max={NAME_MAX} />
          </div>
          <Input
            id="couple-name"
            value={values.couple_name}
            maxLength={NAME_MAX}
            onChange={(e) => onChange('couple_name', e.target.value)}
            placeholder="Ex: João & Maria"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>

        <div>
          <Label htmlFor="relationship-start" className="text-white">Início do relacionamento</Label>
          <Input
            id="relationship-start"
            type="datetime-local"
            value={values.relationship_start}
            onChange={(e) => onChange('relationship_start', e.target.value)}
            className="bg-white/10 border-white/20 text-white [color-scheme:dark]"
          />
          {days !== null && (
            <p className={`mt-1.5 text-sm ${days < 0 ? 'text-amber-400' : 'text-white/60'}`}>
              {days < 0
                ? 'Essa data está no futuro. O contador só começa quando ela chegar.'
                : days === 0
                  ? 'É hoje! O contador começa agora.'
                  : `Já são ${days.toLocaleString('pt-BR')} ${days === 1 ? 'dia' : 'dias'} juntos.`}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-end justify-between">
            <Label htmlFor="custom-phrase" className="text-white">Frase especial</Label>
            <Counter value={values.custom_phrase} max={PHRASE_MAX} />
          </div>
          <Textarea
            id="custom-phrase"
            value={values.custom_phrase}
            maxLength={PHRASE_MAX}
            onChange={(e) => onChange('custom_phrase', e.target.value)}
            placeholder="Ex: Onde tudo começou..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <p className="mt-1 text-xs text-white/40">Aparece embaixo do contador, na página principal.</p>
        </div>
      </CardContent>
    </Card>
  );
}
