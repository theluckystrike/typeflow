
export function processEventCode(input: string): string {
    return input.replace(/Key/g, '').replace(/Left|Right|Digit/g, '').toLowerCase();
}
