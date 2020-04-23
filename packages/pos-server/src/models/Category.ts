import { Schema } from 'mongoose';
import { tenantModel } from './utils/multiTenant';

export interface CategoryProps {
    name: string;
}

const CategorySchema: Schema<CategoryProps> = new Schema({
    name: {
        type: String,
        required: true,
    },
});

const Category = tenantModel<CategoryProps>('Category', CategorySchema);

export { Category };
