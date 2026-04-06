
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AppUser as UserType } from '../types';

interface ProductionInputProps {
  currentUser: UserType;
}

const ProductionInput: React.FC<ProductionInputProps> = () => {
  const { dept } = useParams();
  // Redirecting to the new consolidated QC & Output Log
  return <Navigate to={`/${dept}/input/defects`} replace />;
};

export default ProductionInput;
