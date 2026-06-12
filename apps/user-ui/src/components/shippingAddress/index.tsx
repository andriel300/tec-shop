'use client';

import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import { Plus, X, Edit2, Trash2, Copy, Star } from 'lucide-react';
import React, { useState } from 'react';
import { countries } from '../../lib/utils/countries';
import {
  useShippingAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useCopyAddress,
} from '../../hooks/use-shipping-addresses';
import type { ShippingAddress } from '../../lib/api/address';

const ShippingAddressSection = () => {
  const t = useTranslations('ShippingAddress');
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // React Query hooks
  const { data: addresses = [], isLoading, error } = useShippingAddresses();
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();
  const copyMutation = useCopyAddress();

  const addressCount = addresses.length;
  const maxAddresses = 5;
  const canAddMore = addressCount < maxAddresses;

  const form = useForm({
    defaultValues: {
      label: 'Home',
      name: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phoneNumber: '',
      isDefault: false,
    },
    onSubmit: async ({ value }) => {
      const addressData = {
        ...value,
        state: value.state || undefined,
        phoneNumber: value.phoneNumber || undefined,
      };

      if (editingAddress) {
        // Update existing address
        await updateMutation.mutateAsync(
          {
            id: editingAddress.id,
            data: addressData,
          },
          {
            onSuccess: () => {
              setShowModal(false);
              setEditingAddress(null);
              form.reset();
            },
          }
        );
      } else {
        // Create new address
        await createMutation.mutateAsync(addressData, {
          onSuccess: () => {
            setShowModal(false);
            form.reset();
          },
        });
      }
    },
  });

  const handleEdit = (address: ShippingAddress) => {
    setEditingAddress(address);
    form.setFieldValue('label', address.label);
    form.setFieldValue('name', address.name);
    form.setFieldValue('street', address.street);
    form.setFieldValue('city', address.city);
    form.setFieldValue('state', address.state || '');
    form.setFieldValue('zipCode', address.zipCode);
    form.setFieldValue('country', address.country);
    form.setFieldValue('phoneNumber', address.phoneNumber || '');
    form.setFieldValue('isDefault', address.isDefault);
    setShowModal(true);
  };

  const handleDelete = (addressId: string) => {
    deleteMutation.mutate(addressId, {
      onSuccess: () => {
        setDeleteConfirm(null);
      },
    });
  };

  const handleSetDefault = (addressId: string) => {
    setDefaultMutation.mutate(addressId);
  };

  const handleCopy = (addressId: string) => {
    copyMutation.mutate(addressId);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAddress(null);
    form.reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          {t('savedAddresses', { count: addressCount, max: maxAddresses })}
        </h2>

        <button
          onClick={() => setShowModal(true)}
          disabled={!canAddMore}
          className={`flex items-center gap-1 text-sm font-medium ${
            canAddMore
              ? 'text-blue-600 hover:underline'
              : 'text-gray-400 cursor-not-allowed'
          }`}
          title={
            !canAddMore
              ? t('maxLimitReached')
              : t('addNewAddress')
          }
        >
          <Plus className="w-4 h-4" /> {t('addNewAddress')}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">{t('loading')}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">
            {t('failedToLoad')}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && addressCount === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            {t('noAddresses')}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <Plus className="w-4 h-4" /> {t('addFirstAddress')}
          </button>
        </div>
      )}

      {/* Address List */}
      {!isLoading && !error && addressCount > 0 && (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`border rounded-md p-4 relative ${
                address.isDefault
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Default Badge */}
              {address.isDefault && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                    <Star className="w-3 h-3 fill-current" /> {t('defaultBadge')}
                  </span>
                </div>
              )}

              {/* Address Content */}
              <div className="pr-20">
                <h3 className="font-semibold text-gray-800">{address.label}</h3>
                <p className="text-sm text-gray-700 mt-1">{address.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {address.street}
                  <br />
                  {address.city}
                  {address.state && `, ${address.state}`} {address.zipCode}
                  <br />
                  {address.country}
                </p>
                {address.phoneNumber && (
                  <p className="text-sm text-gray-600 mt-1">
                    {t('phone', { number: address.phoneNumber })}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    disabled={setDefaultMutation.isPending}
                    className="text-xs text-blue-600 hover:underline disabled:text-gray-400"
                  >
                    {t('setAsDefault')}
                  </button>
                )}
                <button
                  onClick={() => handleEdit(address)}
                  className="text-xs text-gray-600 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> {t('edit')}
                </button>
                <button
                  onClick={() => handleCopy(address.id)}
                  disabled={copyMutation.isPending || !canAddMore}
                  className="text-xs text-gray-600 hover:underline flex items-center gap-1 disabled:text-gray-400"
                  title={!canAddMore ? t('maxLimitCopy') : t('copyTitle')}
                >
                  <Copy className="w-3 h-3" /> {t('copy')}
                </button>
                <button
                  onClick={() => setDeleteConfirm(address.id)}
                  className="text-xs text-red-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> {t('delete')}
                </button>
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === address.id && (
                <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center rounded-md">
                  <div className="text-center p-4">
                    <p className="text-sm font-medium text-gray-800 mb-3">
                      {t('deleteConfirm')}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleDelete(address.id)}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                      >
                        {deleteMutation.isPending
                          ? t('deleting')
                          : t('yesDelete')}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-md shadow-md relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={handleCloseModal}
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {editingAddress ? t('modalTitleEdit') : t('modalTitleAdd')}
            </h3>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              {/* Label Selection */}
              <form.Field name="label">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('labelField')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="border rounded-sm w-full p-2"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    >
                      <option value="Home">{t('labelHome')}</option>
                      <option value="Work">{t('labelWork')}</option>
                      <option value="Others">{t('labelOthers')}</option>
                    </select>
                  </div>
                )}
              </form.Field>

              {/* Name */}
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    !value ? t('nameRequired') : undefined,
                }}
              >
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('nameField')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      placeholder={t('namePlaceholder')}
                      className="border rounded-sm w-full p-2"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <span className="text-xs text-red-500">
                        {field.state.meta.errors[0]}
                      </span>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Street */}
              <form.Field
                name="street"
                validators={{
                  onChange: ({ value }) =>
                    !value ? t('streetRequired') : undefined,
                }}
              >
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('streetField')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      placeholder={t('streetPlaceholder')}
                      className="border rounded-sm w-full p-2"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <span className="text-xs text-red-500">
                        {field.state.meta.errors[0]}
                      </span>
                    )}
                  </div>
                )}
              </form.Field>

              {/* City */}
              <form.Field
                name="city"
                validators={{
                  onChange: ({ value }) =>
                    !value ? t('cityRequired') : undefined,
                }}
              >
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('cityField')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      placeholder={t('cityPlaceholder')}
                      className="border rounded-sm w-full p-2"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <span className="text-xs text-red-500">
                        {field.state.meta.errors[0]}
                      </span>
                    )}
                  </div>
                )}
              </form.Field>

              {/* State/Province (Optional) */}
              <form.Field name="state">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('stateField')}
                    </label>
                    <input
                      placeholder={t('statePlaceholder')}
                      className="border rounded-sm w-full p-2"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>

              {/* ZIP Code */}
              <form.Field
                name="zipCode"
                validators={{
                  onChange: ({ value }) =>
                    !value ? t('zipRequired') : undefined,
                }}
              >
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('zipField')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      placeholder={t('zipPlaceholder')}
                      className="border rounded-sm w-full p-2"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <span className="text-xs text-red-500">
                        {field.state.meta.errors[0]}
                      </span>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Country */}
              <form.Field name="country">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('countryField')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="border rounded-sm w-full p-2"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    >
                      {countries.map((country) => (
                        <option key={country.name} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </form.Field>

              {/* Phone Number (Optional) */}
              <form.Field name="phoneNumber">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('phoneField')}
                    </label>
                    <input
                      placeholder={t('phonePlaceholder')}
                      className="border rounded-sm w-full p-2"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>

              {/* Default checkbox */}
              <form.Field name="isDefault">
                {(field) => (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                    />
                    {t('isDefaultCheckbox')}
                  </label>
                )}
              </form.Field>

              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-sm w-full mt-2 disabled:bg-gray-400"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? t('saving')
                  : editingAddress
                  ? t('updateAddress')
                  : t('saveAddress')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingAddressSection;
