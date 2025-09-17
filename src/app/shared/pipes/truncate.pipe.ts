import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: false,
})
export class TruncatePipe implements PipeTransform {
  transform(
    value: string | null | undefined, 
    limit: number = 25, 
    completeWords: boolean = false, 
    ellipsis: string = '...'
  ): string {

    if (value == null) return '';
    if (value.length <= limit) return value;
    if (completeWords) {
      const lastSpaceIndex = value.substr(0, limit).lastIndexOf(' ');
      if (lastSpaceIndex > 0) {
        limit = lastSpaceIndex;
      }
    }

    return `${value.substr(0, limit)}${ellipsis}`;
  }
}