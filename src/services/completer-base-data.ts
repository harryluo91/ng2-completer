import { Subject } from "rxjs";

import { CompleterItem } from "../components/completer-item";
import { CompleterData } from "./completer-data";
import { isNil } from "../globals";

export abstract class CompleterBaseData extends Subject<CompleterItem[] | null> implements CompleterData {

    protected _searchFields: string | null = null;
    protected _titleField: string | null = null;
    protected _descriptionField: string | undefined = undefined;
    protected _imageField: string | undefined = undefined;

    constructor() {
        super();
    }

    public abstract search(term: string): void;

    public cancel() {
        return;
    }

    public searchFields(searchFields: string | null) {
        this._searchFields = searchFields;
        return this;
    }

    public titleField(titleField: string | null) {
        this._titleField = titleField;
        return this;
    }

    public descriptionField(descriptionField: string) {
        this._descriptionField = descriptionField;
        return this;
    }

    public imageField(imageField: string) {
        this._imageField = imageField;
        return this;
    }

    public convertToItem(data: any) {
        let image: string | null = null;
        let formattedText: string;
        let formattedDesc: string | null = null;

        if (this._titleField) {
            formattedText = this.extractTitle(data);
        } else {
            formattedText = data;
        }

        if (typeof formattedText !== "string") {
            formattedText = JSON.stringify(formattedText);
        }

        if (this._descriptionField) {
            formattedDesc = this.extractDescription(data);
        }

        if (typeof formattedDesc !== "string") {
            formattedDesc = JSON.stringify(formattedDesc);
        }

        if (this._imageField) {
            image = this.extractValue(data, this._imageField);
        }

        if (isNil(formattedText)) {
            return null;
        }

        return {
            description: formattedDesc,
            image,
            originalObject: data,
            title: formattedText
        } as CompleterItem;

    }

    protected extractMatches(data: any[], term: string) {
        let matches: any[] = [];
        const searchFields: any[] | null = this._searchFields ? this._searchFields.split(",") : null;
        if (this._searchFields !== null && this._searchFields !== undefined && term !== "" && data.length > 0) {
            matches = data.filter((item) => {
                const values: any[] = searchFields ? this.extractBySearchFields(searchFields, item) : [item];
                return values.some((value) => value
                    .toString()
                    .toLowerCase()
                    .indexOf(term.toString().toLowerCase()) >= 0
                );
            });
        } else if (searchFields && searchFields.length > 0 && data[searchFields[0]]) {
            matches.push(data);
        } else {
            matches = data;
        }

        return matches;
    }

    protected extractTitle(item: any) {
        // split title fields and run extractValue for each and join with ' '
        if (!this._titleField) {
            return "";
        }

        return this._titleField.split(",")
            .map((field) => {
                return this.extractValue(item, field);
            })
            .reduce((acc, titlePart) => acc ? `${acc} ${titlePart}` : titlePart);
    }

    protected extractDescription(item: any) {
        // split title fields and run extractValue for each and join with ' '
        if (!this._descriptionField) {
            return "";
        }

        return this._descriptionField.split(",")
            .map((field) => {
                return this.extractValue(item, field);
            })
            .reduce((acc, titlePart) => acc ? `${acc} ${titlePart}` : titlePart);
    }

    protected extractValue(obj: any, key: string | null) {
        let keys: string[];
        let result: any;
        if (key) {
            keys = key.split(".");
            result = obj;
            for (key of keys) {
                if (result) {
                    result = result[key];
                }
            }
        } else {
            result = obj;
        }
        return result;
    }

    protected processResults(matches: string[]): CompleterItem[] {
        let i: number;
        const results: CompleterItem[] = [];

        if (matches && matches.length > 0) {
            for (i = 0; i < matches.length; i++) {
                const item = this.convertToItem(matches[i]);
                if (item) {
                    results.push(item);
                }
            }
        }
        return results;
    }

    private extractBySearchFields(searchFields: string[], item: any) {
        return searchFields
            .map((searchField) => this.extractValue(item, searchField)).filter((value) => !!value);
    }
}
