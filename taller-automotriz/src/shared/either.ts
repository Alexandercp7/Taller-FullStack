export type Either<E, A> =
  | { readonly _tag: 'Left'; readonly left: E }
  | { readonly _tag: 'Right'; readonly right: A };

export const left = <E, A = never>(e: E): Either<E, A> => ({ _tag: 'Left', left: e });
export const right = <A, E = never>(a: A): Either<E, A> => ({ _tag: 'Right', right: a });

export const isLeft = <E, A>(e: Either<E, A>): e is { _tag: 'Left'; left: E } => e._tag === 'Left';
export const isRight = <E, A>(e: Either<E, A>): e is { _tag: 'Right'; right: A } => e._tag === 'Right';
