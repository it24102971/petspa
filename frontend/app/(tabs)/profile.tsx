import React, { useEffect, useState } from 'react';

import { useSidebar } from '@/context/SidebarContext';

const AUTH_USER_KEY = "auth:user";
const AUTH_TOKEN_KEY = "auth:token";

const getImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${url}`;
};

export default function ProfileScreen() {

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {

  );
}

const styles = StyleSheet.create({

});
