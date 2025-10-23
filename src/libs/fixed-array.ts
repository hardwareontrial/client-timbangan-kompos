export class FixedSizeArray<T> {
  private items: T[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number) {
    if(maxSize <= 0) throw new Error(`Maksimum size harus nilai positif`);
    this.maxSize = maxSize;
  }

  public add(item: T): void {
    this.items.push(item);
    if(this.items.length > this.maxSize) this.items.shift()
  }

  public getArray(): T[] {
    return this.items
  }

  public getSize(): number {
    return this.maxSize
  }
}