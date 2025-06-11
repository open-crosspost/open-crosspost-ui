import React, { useEffect, useState } from "react";
import { getProfile, getImageUrl } from "../../lib/utils/near-social-node";

const fallbackUrl =
  "https://ipfs.near.social/ipfs/bafkreibmiy4ozblcgv3fm3gc6q62s55em33vconbavfd2ekkuliznaq3zm";

interface AvatarProps {
  url?: string;
  accountId: string;
  size?: number;
  className?: string;
}

export const Avatar = ({
  url,
  accountId,
  size = 48,
  className = "",
}: AvatarProps) => {
  const [profileUrl, setProfileUrl] = useState(url);
  const [profileName, setProfileName] = useState(accountId);

  useEffect(() => {
    if (!url && accountId) {
      getProfile(accountId)
        .then((profile) => {
          const imageUrl = getImageUrl(profile?.image);
          if (imageUrl) {
            setProfileUrl(imageUrl);
          }
          if (profile?.name) {
            setProfileName(profile.name);
          }
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
        });
    }
  }, [url, accountId]);

  return (
    <div
      className={`overflow-hidden border-2 border-gray-800 shadow-custom ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <img
        src={profileUrl ?? fallbackUrl}
        alt={profileName}
        className="w-full h-full object-cover"
        style={{ objectFit: "cover" }}
      />
    </div>
  );
};
