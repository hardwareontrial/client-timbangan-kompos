export function handleNumberInput(even: Event, modelValue?: Ref<string|number>): void {
  const target = event.target as HTMLInputElement;
  const numericValue = target.value.replace(/[^0-9]/g, '');
  target.value = numericValue;

  if(modelValue) {
    modelValue.value = numericValue;
  }
}