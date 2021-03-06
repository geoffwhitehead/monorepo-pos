// import { User } from '../models';
// import bcrypt from 'bcryptjs';
// import { Request, Response } from 'express';
// import { createToken } from '../helpers/createToken';
// import { UserProps } from '../models/User';

// const PUBLIC_FIELDS = 'firstName lastName email';

// const create = async (req: Request, res: Response): Promise<void> => {
//     const UserModel = User();

//     const { firstName, lastName, email, password } = req.body;

//     const user = new UserModel({ firstName, lastName, email, password });
//     const errors = user.validateSync();

//     if (errors) {
//         res.status(401).send(errors);
//         return;
//     }

//     const duplicate = await UserModel.find({ email });

//     if (duplicate) {
//         res.status(400).send('User exists');
//         return;
//     }

//     try {
//         const workFactor = 12;
//         user.password = await bcrypt.hash(req.body.password, workFactor);
//         user.token = createToken(user._id, user.email);
//         await user.save();
//         res.status(200).send(user.token);
//     } catch (err) {
//         res.status(400).send(err);
//     }
// };

// /**
//  * Get a single user
//  * @param {String} name - the name of the User to retrieve
//  */
// const getById = async (req: Request, res: Response): Promise<void> => {
//     const { _id } = req.params;
//     try {
//         const user = await User().findById(_id, PUBLIC_FIELDS);
//         res.status(200).send(user);
//     } catch (err) {
//         res.status(400).send(err);
//     }
// };

/**
 * List all the users. Query params ?skip=0&limit=1000 by default
 */

// interface Params {
//     query: {
//         skip: number;
//         limit: number;
//     };
// }
// const getAll = async (params: Params): Promise<UserProps[]> => {
//     const skip = params.query.skip;
//     const limit = params.query.limit;
//     try {
//         const users = await User.find({}, PUBLIC_FIELDS, { skip, limit });
//         return users;
//     } catch (err) {
//         throw new Error('Error fetching users');
//     }
// };

// /**
//  * Update a single user
//  * @param {String} name - the name of the User to update
//  */
// const update = async (req: Request, res: Response): Promise<void> => {
//     const { _id, ...props } = req.body;
//     try {
//         const user = await User().updateOne(_id, props, { runValidators: true });

//         if (user.err) {
//             throw new Error('Errors creating user');
//         }
//         res.send('user updated');
//     } catch (err) {
//         res.status(400).send(err);
//     }
// };

// /**
//  * Remove a single user
//  * @param {String} name - the name of the User to remove
//  */
// const remove = async (req: Request, res: Response): Promise<void> => {
//     const { _id } = req.params;
//     try {
//         const deleteMsg = await User().deleteOne(_id);
//         res.send(deleteMsg);
//     } catch (err) {
//         res.status(400).send(err);
//     }
// };

// export { create, update, remove, getById, getAll };
// export default { getAll };
// import Models from '../models';
// import MailerService from './mailer';
// import { Logger } from 'mongodb';
// import { LoggerService } from '../loaders/logger';
import { InjectedDependencies } from '.';
import { UserProps } from '../models/User';

export interface UserService {
    findAll: () => Promise<UserProps[]>;
    create: (userProps: UserProps) => Promise<UserProps>;
    findByIdAndUpdate: (_id: string, userProps: Partial<UserProps>) => Promise<UserProps>;
    findById: (_id: string) => Promise<UserProps>;
}

/**
 * TODO: user contains confidential properties such as bearer token and password. Need to seperate these properties out into
 * auth records so that the user documents dont contain sensitive info. Currently repo layer is filtering them out.
 */
export const userService = ({ repositories: { userRepository }, logger }: InjectedDependencies): UserService => {
    const findAll: UserService['findAll'] = async () => await userRepository.findAll();
    const create = async props => {
        const user = await userRepository.create(props);
        return user;
    };

    const findByIdAndUpdate = async (_id, props) => {
        const user = await userRepository.findByIdAndUpdate(_id, props);
        return user;
    };

    const findById = async _id => userRepository.findById(_id);

    return {
        findAll,
        create,
        findByIdAndUpdate,
        findById,
    };
};
