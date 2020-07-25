import {LocalDate, LocalTime} from '@js-joda/core';
import {mixed, TestOptions} from 'yup';

class LocalDateSchema extends mixed<LocalDate>
{
    public constructor()
    {
        super({type: 'local-date'});

        this.withMutation(() => {
            this.transform(function (value) {
                if (this.isType(value)) {
                    return value;
                }

                try {
                    return LocalDate.parse(value);
                } catch (e) {
                    return 'invalid';
                }
            });
        });
    }

    protected _typeCheck(value : any)
    {
        return value instanceof LocalDate;
    }
}

export const localDate = () => new LocalDateSchema();

class LocalTimeSchema extends mixed<LocalTime>
{
    public constructor()
    {
        super({type: 'local-time'});

        this.withMutation(() => {
            this.transform(function (value) {
                if (this.isType(value)) {
                    return value;
                }

                try {
                    return LocalTime.parse(value);
                } catch (e) {
                    return 'invalid';
                }
            });
        });
    }

    protected _typeCheck(value : any)
    {
        return value instanceof LocalTime;
    }
}

export const localTime = () => new LocalTimeSchema();

export const sundayTest : TestOptions = {
    test: value => {
        if (!(value instanceof LocalDate)) {
            return false;
        }

        return value.dayOfWeek().value() === 7;
    },
    message: 'Date must be a Sunday',
};

export const saturdayTest : TestOptions = {
    test: value => {
        if (!(value instanceof LocalDate)) {
            return false;
        }

        return value.dayOfWeek().value() === 6;
    },
    message: 'Date must be a Saturday',
};
