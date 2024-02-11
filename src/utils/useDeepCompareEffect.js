import { useEffect, useRef } from 'react';
import isEqual from 'lodash/isEqual';

const useDeepCompareEffect = (callback, dependencies) => {
  const currentDependenciesRef = useRef();

  if (!isEqual(currentDependenciesRef.current, dependencies)) {
    console.log('Changes in dependencies:');
    console.log('Previous:', currentDependenciesRef.current);
    console.log('Current:', dependencies);
    currentDependenciesRef.current = dependencies;
  }

  useEffect(callback, [currentDependenciesRef.current]);
};

export default useDeepCompareEffect;
