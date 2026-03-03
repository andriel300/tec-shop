export class ShippingAddress {
  id!: string;
  userId!: string;
  userProfileId!: string;
  label!: string;
  name!: string;
  street!: string;
  city!: string;
  state!: string | null;
  zipCode!: string;
  country!: string;
  phoneNumber!: string | null;
  isDefault!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
